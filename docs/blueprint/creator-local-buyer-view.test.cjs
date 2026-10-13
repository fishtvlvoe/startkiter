'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('./creator-local-shell.js');
const V = require('./creator-local-buyer-view.js');

// 保留共用契約核准的三組課程 ID 與名稱。
const resources = [
  { id: 'course-ai', name: 'AI自動化入門' },
  { id: 'course-saas', name: '用AI建立會員服務' },
  { id: 'course-product', name: '打造第一個線上產品' }
];
function product(overrides = {}) {
  return { id: 'bundle-one', name: '兩堂課組合', type: 'bundle', price: 1200,
    billing: 'once', period: null, status: 'published',
    courses: ['course-ai', 'course-saas'], kit: false, service: false, ...overrides };
}
function context({ products = [], acquired = [], sub = 'library', page = 'buyer', detailId = '' } = {}) {
  return S.context({ role: 'buyer', group: 'buyer', sub, page,
    data: { products, acquired }, fixtures: { resources }, filters: { detailId } });
}
// 整個 quoted value 一次消耗，避免把名稱或 value 裡的 onerror 當成屬性鍵。
function assertSafeHTML(html) {
  const decode = value => value.replace(/&#(?:x([\da-f]+)|(\d+));?|&(colon|Tab|NewLine|amp);/gi,
    (match, hex, decimal, named) => hex || decimal
      ? String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10))
      : ({ colon: ':', tab: '\t', newline: '\n', amp: '&' })[named.toLowerCase()]);
  const tags = html.match(/<[a-z][\w:-]*(?:[^<>"']|"[^"]*"|'[^']*')*>/gi) || [];
  for (const tag of tags) {
    const start = /^<([\w:-]+)/.exec(tag);
    const element = start[1].toLowerCase();
    assert.notEqual(element, 'script', '模板不可內嵌腳本');
    const attributes = tag.slice(start[0].length, -1);
    for (const attribute of attributes.matchAll(/([^\s=<>"'`/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s<>"'`=]+)))?/g)) {
      const key = attribute[1].toLowerCase();
      const value = decode(attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
      assert.doesNotMatch(key, /^on/i, '模板不可內嵌事件屬性');
      assert.notEqual(key, 'download', '模板不可提供下載');
      if (['href', 'src', 'action'].includes(key)) {
        assert.doesNotMatch(value.replace(/[\u0000-\u0020]/g, ''), /^javascript:/i,
          '模板不可使用 JavaScript URL');
      }
      if ((element === 'a' && key === 'href') || (element === 'form' && key === 'action')) {
        assert.doesNotMatch(value.trim(), /^https?:/i, '模板不可導向外部下載、登入或付款');
      }
    }
  }
}
function render(ctx) {
  const before = JSON.stringify(ctx);
  assert.ok(Object.isFrozen(ctx));
  assert.ok(Object.isFrozen(ctx.acquired));
  assert.ok(Object.isFrozen(ctx.fixtures.resources));
  const html = V.render(ctx);
  assert.equal(typeof html, 'string');
  assert.equal(JSON.stringify(ctx), before, '模板不得修改凍結 context');
  assertSafeHTML(html);
  return html;
}
function action(html, command, id) {
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || [];
  const found = buttons.find(button => button.includes(`data-local-action="${command}"`)
    && (id === undefined || button.includes(`data-id="${S.escape(id)}"`)));
  assert.ok(found, `缺少本機 ${command}${id === undefined ? '' : ':' + id} 按鈕`);
  assert.match(found, /type="button"/);
  return found;
}
function resourceIds(html) {
  return [...html.matchAll(/<button\b[^>]*>/g)]
    .map(match => match[0]).filter(tag => tag.includes('data-local-action="resource"'))
    .map(tag => /data-id="([^"]+)"/.exec(tag)?.[1]).sort();
}

test('安全檢查拒絕真正事件屬性，包含雙引號、單引號與未加引號', () => {
  for (const html of ['<button onclick="boom">', "<button onClick='boom'>", '<img onerror=boom>']) {
    assert.throws(() => assertSafeHTML(html), { code: 'ERR_ASSERTION' });
  }
});

test('安全檢查允許 escaped 文字與 value 內的事件字樣', () => {
  const name = '<img src=x onerror="alert(1)"> javascript: download';
  assert.doesNotThrow(() => assertSafeHTML(`<input value="${S.escape(name)}"><p>${S.escape(name)}</p>`));
  assert.doesNotThrow(() => assertSafeHTML('<input value=\'onerror="boom" href="javascript:boom"\'>'));
});

test('安全檢查拒絕 href/src 的 JavaScript URL，包含編碼與控制字元', () => {
  for (const html of ['<a href="javascript:boom">', "<img src='JaVaScRiPt:boom'>",
    '<a href=javascript:boom>', '<a href="java&#x73;cript&colon;boom">', '<img src="java&#10;script:boom">']) {
    assert.throws(() => assertSafeHTML(html), { code: 'ERR_ASSERTION' });
  }
});

test('安全檢查仍拒絕 script、下載與外部連結或表單', () => {
  for (const html of ['<script>', '<a download>', '<a download="kit.zip">',
    '<a href="https://example.test">', "<form action='https://example.test'>"]) {
    assert.throws(() => assertSafeHTML(html), { code: 'ERR_ASSERTION' });
  }
});

test('Node 匯出只有 render；瀏覽器註冊保留其他角色', () => {
  assert.deepEqual(Object.keys(V), ['render']);
  assert.equal(typeof V.render, 'function');
  const admin = { render: () => '管理員' }, creator = { render: () => '創作者' };
  const sandbox = { CreatorLocalViews: { admin, creator } };
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync(require.resolve('./creator-local-buyer-view.js'), 'utf8'), sandbox);
  assert.equal(sandbox.window.CreatorLocalViews.admin, admin);
  assert.equal(sandbox.window.CreatorLocalViews.creator, creator);
  assert.equal(typeof sandbox.window.CreatorLocalViews.buyer.render, 'function');
});

test('未取得 library 有固定容器與明確空態，登入不授予全部課程', () => {
  const html = render(context({ products: [product()] }));
  assert.match(html, /id="local-library"/);
  assert.match(html, /尚未取得|還沒有取得/);
  assert.match(html, /登入不會取得全部課程|登入不代表取得全部課程/);
  assert.deepEqual(resourceIds(html), []);
  assert.doesNotMatch(html, /data-acquired-id=/);
});

test('catalog 只顯示 published 商品，不顯示 draft', () => {
  const published = product({ id: 'public-one', name: '公開商品' });
  const draft = product({ id: 'draft-one', name: '不可公開的草稿' });
  draft.status = 'draft';
  const html = render(context({ sub: 'catalog', products: [published, draft] }));
  assert.match(html, /data-product-id="public-one"/);
  assert.match(html, /公開商品/);
  action(html, 'acquire', 'public-one');
  assert.doesNotMatch(html, /draft-one|不可公開的草稿/);
  assert.deepEqual(resourceIds(html), []);
});

test('已取得兩課使用快照，現行商品改第三課不改交付', () => {
  const snapshot = product({ name: '取得當時的兩堂課' });
  const current = product({ name: '目前已改版商品', status: 'draft', courses: ['course-product'] });
  const ctx = context({ products: [current], acquired: [snapshot] });
  assert.ok(Object.isFrozen(ctx.acquired[0].courses));
  const html = render(ctx);
  assert.match(html, /data-acquired-id="bundle-one"/);
  assert.match(html, /取得當時的兩堂課/);
  assert.match(html, /AI自動化入門/);
  assert.match(html, /用AI建立會員服務/);
  assert.deepEqual(resourceIds(html), ['course-ai', 'course-saas']);
  assert.doesNotMatch(html, /course-product|打造第一個線上產品|目前已改版商品/);
});

test('現行商品移除後，已取得快照仍保留兩課入口', () => {
  const html = render(context({ acquired: [product()] }));
  assert.match(html, /data-acquired-id="bundle-one"/);
  assert.deepEqual(resourceIds(html), ['course-ai', 'course-saas']);
});

test('Standalone kit 的 courses 空陣列只提供 kit 入口', () => {
  const kit = product({ id: 'kit-one', name: '獨立程式碼包', type: 'code', courses: [], kit: true });
  const html = render(context({ acquired: [kit] }));
  assert.match(html, /data-acquired-id="kit-one"/);
  assert.match(html, /程式碼包/);
  assert.deepEqual(resourceIds(html), ['kit']);
  action(html, 'resource', 'kit');
  assert.doesNotMatch(html, /AI自動化入門|用AI建立會員服務|打造第一個線上產品/);
});

test('SaaS-only 沒有 course 或 kit，只提供 service 入口', () => {
  const service = product({ id: 'service-one', name: '會員服務', type: 'saas',
    billing: 'subscription', period: 'month', courses: [], kit: false, service: true });
  const html = render(context({ acquired: [service] }));
  assert.match(html, /data-acquired-id="service-one"/);
  assert.match(html, /SaaS|服務入口/);
  assert.deepEqual(resourceIds(html), ['service']);
  action(html, 'resource', 'service');
  assert.doesNotMatch(html, /私人程式碼包|AI自動化入門|用AI建立會員服務|打造第一個線上產品/);
});

test('公開商品 acquire 帶商品 ID，明示模擬且不假報付款成功', () => {
  const html = render(context({ sub: 'catalog', products: [product()] }));
  const button = action(html, 'acquire', 'bundle-one');
  assert.match(button, /模擬取得/);
  assert.match(html, /不扣款|沒有付款|未串接付款|付款.{0,12}未串接/);
  assert.doesNotMatch(html, /付款成功|支付成功|訂單成立|正式授權成功/);
});

test('重複取得商品標示已取得，不假報付款成功', () => {
  const record = product();
  const html = render(context({ sub: 'catalog', products: [record], acquired: [record] }));
  assert.match(html, /data-product-id="bundle-one"/);
  assert.match(html, /已取得/);
  assert.doesNotMatch(html, /付款成功|支付成功|訂單成立|正式授權成功/);
});

test('公開及已取得商品 name markup 由共用 escape 轉義', () => {
  const name = '<img src=x onerror="alert(1)"> & \'買家\'';
  const html = render(context({ products: [product({ id: 'public-markup', name })],
    acquired: [product({ id: 'snapshot-markup', name })] }));
  assert.match(html, /data-product-id="public-markup"/);
  assert.match(html, /data-acquired-id="snapshot-markup"/);
  assert.ok(html.split(S.escape(name)).length - 1 >= 2, '公開與已取得名稱皆需轉義');
  assert.doesNotMatch(html, /<img\b|<[^>]+\sonerror\s*=/i);
});

test('kit detail 提供交付說明與 back，不下載真實程式', () => {
  const html = render(context({ page: 'detail', detailId: 'resource:kit', acquired: [
    product({ type: 'code', courses: [], kit: true })
  ] }));
  assert.match(html, /程式碼包/);
  assert.match(html, /程式庫/);
  assert.match(html, /操作手冊/);
  assert.match(html, /AI Skill/);
  assert.match(html, /不下載|未提供.{0,8}下載/);
  action(html, 'back');
  assert.deepEqual(resourceIds(html), []);
});

test('service detail 說明獨立服務權限與 back，不登入外部服務', () => {
  const html = render(context({ page: 'detail', detailId: 'resource:service', acquired: [
    product({ type: 'saas', courses: [], service: true })
  ] }));
  assert.match(html, /SaaS|服務入口/);
  assert.match(html, /使用者|帳戶/);
  assert.match(html, /付費權限|服務權限/);
  assert.match(html, /課程.{0,15}分開|與.{0,10}課程.{0,10}獨立/);
  assert.match(html, /不登入|未串接.{0,8}登入/);
  action(html, 'back');
  assert.deepEqual(resourceIds(html), []);
});

test('course detail 使用核准名稱與 back，教材及正式權限未串接', () => {
  const html = render(context({ page: 'detail', detailId: 'resource:course-ai', acquired: [product()] }));
  assert.match(html, /AI自動化入門/);
  assert.match(html, /課程.{0,10}示範入口|示範.{0,10}課程入口/);
  assert.match(html, /未載入教材|教材.{0,8}未串接/);
  assert.match(html, /未.{0,10}驗證正式權限|正式權限.{0,8}未串接/);
  action(html, 'back');
  assert.deepEqual(resourceIds(html), []);
  assert.doesNotMatch(html, /打造第一個線上產品/);
});

test('未取得的 course detail 不因全域 fixtures 而提供教材入口', () => {
  const html = render(context({ page: 'detail', detailId: 'resource:course-product', acquired: [product()] }));
  assert.match(html, /尚未取得|未取得|無法查看/);
  action(html, 'back');
  assert.deepEqual(resourceIds(html), []);
  assert.doesNotMatch(html, /打造第一個線上產品|<iframe\b|<video\b/);
});
