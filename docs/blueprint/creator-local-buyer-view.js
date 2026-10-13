// 買家本機預覽只呈現取得快照；正式授權與本機命令由主控處理。
(function (root) {
  function render(ctx) {
    const { escape, button, heading, price, resourceNames } = ctx.helpers;
    if (ctx.role !== 'buyer' || ctx.group !== 'buyer') {
      return heading('不支援這個買家入口', '請回到買家預覽。');
    }
    // 只去重本次呈現，不更動保存資料，也不以現行商品覆蓋取得快照。
    const seen = new Set();
    const acquired = ctx.acquired.filter(record => {
      if (seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    });
    const courseName = id => (ctx.fixtures.resources || []).find(resource => resource.id === id)?.name || '未指定課程';
    if (ctx.page === 'detail') {
      const detailId = ctx.filters.detailId || '';
      const id = detailId.startsWith('resource:') ? detailId.slice('resource:'.length) : '';
      const allowed = id && acquired.some(record => id === 'kit' ? record.kit
        : id === 'service' ? record.service : record.courses.includes(id));
      let title = '尚未取得內容';
      let description = '尚未取得這項內容，無法查看。';
      if (allowed) {
        if (id === 'kit') {
          title = '程式碼包交付';
          description = '正式流程將提供程式庫、操作手冊與 AI Skill；此處不下載真實程式。';
        } else if (id === 'service') {
          title = 'SaaS 服務入口';
          description = '正式服務有自己的使用者與付費權限，與本平台課程分開；此處不登入任何外部服務。';
        } else {
          title = courseName(id);
          description = '這是所取得課程的示範入口，未載入教材或驗證正式權限。';
        }
      }
      return heading(title, '本機示範詳情，付款未串接。', button('返回買家畫面', 'back'))
        + `<div class="demo-panel"><p>${escape(description)}</p></div>`;
    }
    if (ctx.page !== 'buyer' || !['library', 'catalog'].includes(ctx.sub)) {
      return heading('不支援這個買家入口', '請回到買家預覽。');
    }
    const resourceList = record => `<ul>${resourceNames(record).map(name => `<li>${escape(name)}</li>`).join('')}</ul>`;
    const library = acquired.length ? acquired.map(record => {
      const actions = record.courses.map(id => button('查看課程：' + courseName(id), 'resource', id));
      if (record.kit) actions.push(button('查看程式碼包說明', 'resource', 'kit'));
      if (record.service) actions.push(button('查看 SaaS 服務入口', 'resource', 'service'));
      return `<article class="demo-record" data-acquired-id="${escape(record.id)}"><h4>${escape(record.name)}</h4>${resourceList(record)}<div class="local-actions">${actions.join('')}</div></article>`;
    }).join('') : '<p class="demo-empty">尚未取得內容。先從下方選一個商品「模擬取得」。登入不會取得全部課程。</p>';
    const published = ctx.products.filter(record => record.status === 'published');
    const catalog = published.length ? `<div class="local-records">${published.map(record =>
      `<article class="demo-record" data-product-id="${escape(record.id)}"><h4>${escape(record.name)}</h4><p class="local-subtitle">${escape(price(record))}</p>${resourceList(record)}<div class="local-actions">${button(seen.has(record.id) ? '已取得 · 查看內容' : '模擬取得（不扣款）', 'acquire', record.id)}</div></article>`
    ).join('')}</div>` : '<p class="demo-empty">目前沒有可取得的公開商品。</p>';
    return heading('買家畫面', '這是示範買家；取得哪個商品，只會看到該商品的交付。付款未串接，不會扣款或取得正式授權。')
      + `<div class="demo-panel"><h4>我的內容</h4><div id="local-library" class="local-library">${library}</div></div>`
      + `<div class="demo-panel"><h4>可取得的示範商品</h4>${catalog}</div>`;
  }
  const api = { render };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.CreatorLocalViews = root.CreatorLocalViews || {};
    root.CreatorLocalViews.buyer = api;
  }
})(globalThis);
