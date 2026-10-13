const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const S = require('./creator-local-shell.js');
const N = require('./creator-local-navigation.js');
const V = require('./creator-local-creator-view.js');

const bundle = {id:'creator-bundle',name:'Creator Bundle',type:'bundle',price:1200,billing:'subscription',period:'quarter',status:'published',courses:['course-ai','course-saas'],kit:true,service:false};
const code = {id:'creator-code',name:'獨立程式碼包',type:'code',price:8800,billing:'once',period:null,status:'draft',courses:[],kit:true,service:false};
const course = {id:'creator-course',name:'AI 課程',type:'course',price:600,billing:'once',period:null,status:'published',courses:['course-product'],kit:false,service:false};
const fixtures = {
  resources:[{id:'course-ai',name:'AI自動化入門'},{id:'course-saas',name:'用AI建立會員服務'},{id:'course-product',name:'打造第一個線上產品'}],
  contacts:[{id:'contact-one',name:'示範聯絡人 A',source:'課程報名',consent:'yes',tag:'課程學員'},{id:'contact-two',name:'示範聯絡人 B',source:'網站表單',consent:'no',tag:'新名單'}],
  events:[{id:'live-one',name:'每週創作者問答',kind:'live',time:'10 月 18 日 19:30',status:'已排程'},{id:'evergreen-one',name:'自動化入門說明會',kind:'evergreen',time:'報名後依規則安排觀看',status:'草稿'}]
};
function context(overrides={}) {
  return S.context({role:'creator',group:'products',sub:'all',page:'products',data:{products:[bundle,code,course],acquired:[]},fixtures,editing:null,...overrides,
    filters:{productKind:'all',productStatus:'all',productSearch:'',contactConsent:'all',contactSearch:'',liveKind:'all',liveSearch:'',detailId:'',...overrides.filters}});
}
function render(overrides={}) {
  const ctx=context(overrides);
  const before=JSON.stringify(ctx);
  const html=V.render(ctx);
  assert.equal(typeof html,'string');
  assert.equal(JSON.stringify(ctx),before,'render 不得修改 context');
  assert.ok(Object.isFrozen(ctx)&&Object.isFrozen(ctx.filters)&&Object.isFrozen(ctx.fixtures)&&Object.isFrozen(ctx.products));
  assertSafeAttributes(html);
  return html;
}
// 只解析契約會用到的標記，不新增 DOM 或瀏覽器依賴。
function attrs(tag) {
  const result={};
  for(const m of tag.matchAll(/([^\s=<>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) result[m[1]]=m[2]??m[3]??m[4]??'';
  return result;
}
function tags(html,name) {return [...html.matchAll(new RegExp(`<(?:${name})\\b(?:"[^"]*"|'[^']*'|[^'">])*>`,'gi'))].map(m=>attrs(m[0]));}
function assertSafeAttributes(html) {
  for(const tag of tags(html,'[a-z][a-z0-9-]*')) for(const [key,value] of Object.entries(tag)) {
    assert.doesNotMatch(key,/^on/i,'不得輸出事件屬性');
    if(/^(?:href|src)$/i.test(key)) {
      // URL 實體在瀏覽器會解碼，空白與控制字元不能繞過檢查。
      const decoded=value.replace(/&#(x[0-9a-f]+|[0-9]+);?/gi,(_,n)=>{
        const point=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);
        return point<=0x10ffff?String.fromCodePoint(point):'\uFFFD';
      }).replace(/&colon;/gi,':').replace(/&(?:tab|newline);/gi,'').replace(/[\u0000-\u0020\u007f]/g,'');
      assert.doesNotMatch(decoded,/^javascript:/i,'不得輸出 javascript URL');
    }
  }
  assert.doesNotMatch(html,/<(?:img|svg|script)\b/i,'不得產生注入標記');
}
test('安全檢查允許已轉義 input 值與命令 ID，不把值當屬性',()=>{
  assert.doesNotThrow(()=>assertSafeAttributes('<input value="&lt;img src=x onerror=&quot;boom&quot;&gt;"><button data-id="&lt;svg onload=&quot;boom&quot;&gt;">查看</button>'));
});
test('安全檢查拒絕真正 onclick 與大小寫事件屬性',()=>{
  for(const html of ['<button onclick="boom">執行</button>','<button ONCLICK=boom>執行</button>','<img src=x onerror="boom">']) assert.throws(()=>assertSafeAttributes(html),assert.AssertionError);
});
test('安全檢查拒絕真正 href/src javascript URL',()=>{
  for(const html of ['<a href="javascript:boom">連結</a>','<iframe src=" JavaScript:boom ">','<a href="java&#x73;cript:boom">連結</a>','<a href="java&#115;cript:boom">連結</a>']) assert.throws(()=>assertSafeAttributes(html),assert.AssertionError);
});
test('安全檢查拒絕未轉義 img/svg/script 注入，即使沒有事件屬性',()=>{
  for(const html of ['<img src=x>','<svg></svg>','<script>boom</script>']) assert.throws(()=>assertSafeAttributes(html),assert.AssertionError);
});
function byId(html,id) {
  const tag=tags(html,'[a-z][a-z0-9-]*').find(a=>a.id===id);
  assert.ok(tag,`缺少 #${id}`);
  return tag;
}
function input(html,name,value) {
  const tag=tags(html,'input').find(a=>a.name===name&&(value===undefined||a.value===value));
  assert.ok(tag,`缺少 input ${name}=${value??''}`);
  return tag;
}
function selected(html,name,value,expected=true) {assert.equal(Object.hasOwn(input(html,name,value),'checked'),expected,`${name}=${value} 選取狀態`);}
function command(html,action,id) {
  const tag=tags(html,'button').find(a=>a['data-local-action']===action&&(id===undefined||a['data-id']===id));
  assert.ok(tag,`缺少 ${action}:${id??''} 命令`);
  return tag;
}
function cardIds(html) {return tags(html,'article|div|li').filter(a=>a['data-product-id']).map(a=>a['data-product-id']).sort();}
function empty(html) {assert.match(html,/沒有符合|查無|找不到|尚無|沒有.*(?:商品|客戶|聯絡人|活動)/);}
function boundary(html) {
  assert.match(html,/未串接/);
  assert.doesNotMatch(html,/已(?:成功)?(?:儲存|保存|付款|寄送|寄信|開播)|設定已(?:儲存|保存)|連線成功/);
}

test('Node 匯出僅有 render，stub 可正常 require',()=>{
  assert.deepEqual(Object.keys(V),['render']);
  assert.equal(typeof V.render,'function');
});
test('瀏覽器 UMD 保留其他角色 namespace',()=>{
  const admin={render:()=> 'admin'},buyer={render:()=> 'buyer'};
  const sandbox={CreatorLocalViews:{admin,buyer}};
  vm.runInNewContext(fs.readFileSync(require.resolve('./creator-local-creator-view.js'),'utf8'),sandbox);
  assert.equal(sandbox.CreatorLocalViews.admin,admin);
  assert.equal(sandbox.CreatorLocalViews.buyer,buyer);
  assert.equal(typeof sandbox.CreatorLocalViews.creator.render,'function');
});
test('Creator Bundle 編輯回填名稱、價格、季度訂閱與交付',()=>{
  const html=render({page:'form',sub:'bundle',editing:bundle});
  assert.equal(byId(html,'local-name').value,'Creator Bundle');
  assert.equal(byId(html,'local-price').value,'1200');
  for(const [name,value] of [['type','bundle'],['billing','subscription'],['period','quarter'],['status','published'],['courses','course-ai'],['courses','course-saas']]) selected(html,name,value);
  selected(html,'courses','course-product',false);
  selected(html,'kit',undefined);
  selected(html,'service',undefined,false);
});
test('新表單名稱與價格空白，預設 course/once/month/draft 且交付未選',()=>{
  const html=render({page:'form',editing:null});
  assert.equal(byId(html,'local-name').value,'');
  assert.equal(byId(html,'local-price').value,'');
  for(const [name,value] of [['type','course'],['billing','once'],['period','month'],['status','draft']]) selected(html,name,value);
  for(const r of fixtures.resources) selected(html,'courses',r.id,false);
  selected(html,'kit',undefined,false);selected(html,'service',undefined,false);
});
test('表單保留四種商品、兩種收費、三種週期與狀態 radio 選項',()=>{
  const html=render({page:'form'});
  for(const [name,values] of Object.entries({type:['course','bundle','code','saas'],billing:['once','subscription'],period:['month','quarter','year'],status:['draft','published']})) {
    assert.deepEqual(tags(html,'input').filter(a=>a.name===name).map(a=>a.value).sort(),values.slice().sort());
    for(const value of values) assert.equal(input(html,name,value).type,'radio');
  }
  for(const r of fixtures.resources) assert.equal(input(html,'courses',r.id).type,'checkbox');
  for(const name of ['kit','service']) assert.equal(input(html,name).type,'checkbox');
});
test('表單 selector、隱藏錯誤區、submit 與取消命令保留',()=>{
  const html=render({page:'form'});
  assert.ok(Object.hasOwn(byId(html,'local-form'),'novalidate'));
  assert.ok(Object.hasOwn(byId(html,'local-form-error'),'hidden'));
  assert.equal(byId(html,'local-save').type,'submit');
  for(const id of ['local-period','local-courses','local-kit-label','local-service-label']) byId(html,id);
  for(const name of ['name','price']) input(html,name);
  command(html,'nav','products');
  assert.doesNotMatch(html,/已(?:儲存|保存)/);
});
test('獨立 code 商品編輯不強綁任何課程',()=>{
  const html=render({page:'form',sub:'code',editing:code});
  selected(html,'type','code');selected(html,'kit',undefined);
  for(const r of fixtures.resources) selected(html,'courses',r.id,false);
  assert.ok(Object.hasOwn(byId(html,'local-courses'),'hidden'));
});
test('商品列表保留搜尋、容器、卡片與編輯命令，顯示選定交付及季度價格',()=>{
  const html=render();
  byId(html,'local-search');byId(html,'local-products');
  assert.deepEqual(cardIds(html),[bundle.id,code.id,course.id].sort());
  for(const p of [bundle,code,course]) command(html,'edit',p.id);
  command(html,'new');
  assert.match(html,/Creator Bundle/);assert.match(html,/1,200/);assert.match(html,/每季/);
  for(const name of S.context({fixtures}).helpers.resourceNames(bundle)) assert.ok(html.includes(S.escape(name)));
});
test('productKind=code 只列出獨立程式碼商品',()=>{
  const html=render({sub:'code',filters:{productKind:'code'}});
  assert.deepEqual(cardIds(html),[code.id]);
  command(html,'edit',code.id);
});
test('商品搜尋與狀態共同套用，保留搜尋值及狀態命令',()=>{
  const html=render({filters:{productSearch:'  creator bundle  ',productStatus:'published'}});
  assert.deepEqual(cardIds(html),[bundle.id]);
  assert.equal(byId(html,'local-search').value,'  creator bundle  ');
  for(const status of ['all','draft','published']) assert.equal(command(html,'filter',status)['aria-pressed'],String(status==='published'));
});
test('商品搜尋命中但狀態不符時顯示空結果',()=>{
  const html=render({filters:{productSearch:'Creator Bundle',productStatus:'draft'}});
  byId(html,'local-products');assert.deepEqual(cardIds(html),[]);empty(html);
  assert.doesNotMatch(html,/data-local-action="edit"/);
});
test('商品種類與搜尋共同套用，不用其他種類補空列表',()=>{
  const html=render({filters:{productKind:'code',productSearch:'Creator Bundle'}});
  assert.deepEqual(cardIds(html),[]);empty(html);
});
test('空商品快照仍保留工具列與明確空狀態',()=>{
  const html=render({data:{products:[],acquired:[]}});
  byId(html,'local-search');byId(html,'local-products');command(html,'new');empty(html);
});
test('CRM 列表保留 selectors、同意 filters 與詳情命令',()=>{
  const html=render({group:'contacts',sub:'contacts',page:'contacts'});
  byId(html,'local-contact-search');byId(html,'local-contacts');
  for(const c of fixtures.contacts) {assert.ok(html.includes(c.name));command(html,'contact',c.id);}
  for(const value of ['all','yes','no']) command(html,'contact-filter',value);
  assert.match(html,/示範/);assert.match(html,/不會寄信|未串接/);
});
test('CRM 同意與標籤搜尋共同篩選且保留搜尋值',()=>{
  const html=render({group:'contacts',sub:'contacts',page:'contacts',filters:{contactConsent:'no',contactSearch:'新名單'}});
  assert.equal(byId(html,'local-contact-search').value,'新名單');
  command(html,'contact','contact-two');assert.doesNotMatch(html,/data-id="contact-one"/);
  assert.equal(command(html,'contact-filter','no')['aria-pressed'],'true');
});
test('CRM 搜尋與同意條件衝突顯示空結果',()=>{
  const html=render({group:'contacts',sub:'contacts',page:'contacts',filters:{contactConsent:'yes',contactSearch:'新名單'}});
  byId(html,'local-contacts');empty(html);assert.doesNotMatch(html,/data-local-action="contact"/);
});
test('空 CRM fixtures 不捏造聯絡人',()=>{
  const html=render({group:'contacts',sub:'contacts',page:'contacts',fixtures:{resources:fixtures.resources,contacts:[],events:[]}});
  byId(html,'local-contacts');empty(html);assert.doesNotMatch(html,/示範聯絡人 [AB]/);
});
test('Live 列表保留 selectors、種類 filters 與活動詳情命令',()=>{
  const html=render({group:'live',sub:'all',page:'live'});
  byId(html,'local-live-search');byId(html,'local-events');
  for(const event of fixtures.events) {assert.ok(html.includes(event.name));assert.ok(html.includes(event.time));command(html,'event',event.id);}
  for(const kind of ['all','live','evergreen']) command(html,'live-filter',kind);
  assert.match(html,/不會.*開播|未串接/);
});
test('Live 種類與搜尋共同篩選',()=>{
  const html=render({group:'live',sub:'evergreen',page:'live',filters:{liveKind:'evergreen',liveSearch:'自動化'}});
  assert.equal(byId(html,'local-live-search').value,'自動化');
  command(html,'event','evergreen-one');assert.doesNotMatch(html,/data-id="live-one"/);
  assert.equal(command(html,'live-filter','evergreen')['aria-pressed'],'true');
});
test('Live 搜尋與種類衝突顯示空結果',()=>{
  const html=render({group:'live',sub:'all',page:'live',filters:{liveKind:'live',liveSearch:'自動化'}});
  byId(html,'local-events');empty(html);assert.doesNotMatch(html,/data-local-action="event"/);
});
test('空 Live fixtures 不捏造活動',()=>{
  const html=render({group:'live',sub:'all',page:'live',fixtures:{resources:fixtures.resources,contacts:[],events:[]}});
  byId(html,'local-events');empty(html);assert.doesNotMatch(html,/data-local-action="event"/);
});
// 無選定資料時仍保留返回命令與验收邊界。
for(const [group,sub] of [['contacts','contacts'],['live','all']]) test(`${group} 詳情頁提供契約返回命令且揭露未串接`,()=>{
  const html=render({group,sub,page:'detail'});
  boundary(html);
  assert.ok(tags(html,'button').some(a=>a['data-local-action']==='back'||(a['data-local-action']==='nav'&&a['data-id']===group)),'詳情需能返回原列表');
});
test('contact:fixtureID 詳情正確選名單、轉義文字，back 不改原篩選',()=>{
  const contact={...fixtures.contacts[1],name:'<b>聯絡人</b>',source:'<i>表單</i>',tag:'新名單 & 未同意'};
  const html=render({group:'contacts',sub:'contacts',page:'detail',fixtures:{...fixtures,contacts:[fixtures.contacts[0],contact]},filters:{detailId:'contact:contact-two',contactConsent:'no',contactSearch:'新名單'}});
  for(const text of [contact.name,contact.source,contact.tag]) assert.ok(html.includes(S.escape(text)));
  assert.match(html,/未同意|不可寄送/);assert.doesNotMatch(html,/<b>|<i>|示範聯絡人 A/);
  command(html,'back');boundary(html);
});
test('event:fixtureID 詳情正確選活動、轉義文字，back 不改原篩選',()=>{
  const event={...fixtures.events[1],name:'<b>常青活動</b>',time:'<i>安排時間</i>',status:'草稿 & 示範'};
  const html=render({group:'live',sub:'evergreen',page:'detail',fixtures:{...fixtures,events:[fixtures.events[0],event]},filters:{detailId:'event:evergreen-one',liveKind:'evergreen',liveSearch:'常青'}});
  for(const text of [event.name,event.time,event.status]) assert.ok(html.includes(S.escape(text)));
  assert.match(html,/預錄常青/);assert.doesNotMatch(html,/<b>|<i>|每週創作者問答/);
  command(html,'back');boundary(html);
});
for(const group of ['settings','site','email','automation','sales']) {
  const items=group==='settings'?N.items('creator',group).filter(i=>['payment','domains'].includes(i.id)):N.items('creator',group);
  for(const item of items) test(`${group}/${item.id} 預覽具位置說明與未串接邊界`,()=>{
    const html=render({group,sub:item.id,page:'navigation-preview'});
    boundary(html);byId(html,'local-heading');
    assert.ok(html.includes(S.escape(item.label)),'必須說明目前子頁位置');
    assert.match(html,/<(?:section|article|div)\b/,'預覽須有結構化版型');
    assert.equal(tags(html,'form').length,0,'未串接設定不提供假保存表單');
    for(const b of tags(html,'button')) assert.ok(['nav','module','submenu','back'].includes(b['data-local-action']),'預覽不得使用未核准或假保存命令');
  });
}
test('商品名稱與搜尋值 markup 轉義，不產生注入標記',()=>{
  const malicious='<img src=x onerror="boom"> & \' "';
  const p={...bundle,name:malicious};
  const html=render({data:{products:[p],acquired:[]},filters:{productSearch:malicious}});
  assert.ok(html.includes(S.escape(malicious)));
  assert.equal(byId(html,'local-search').value,S.escape(malicious));
  assert.doesNotMatch(html,/<(?:img|svg|script)\b/i);
});
test('編輯表單名稱與課程名稱 markup 轉義',()=>{
  const text='<script>boom</script> & " \' ';
  const html=render({page:'form',editing:{...bundle,name:text},fixtures:{...fixtures,resources:fixtures.resources.map(r=>({...r,name:text}))}});
  assert.equal(byId(html,'local-name').value,S.escape(text));
  assert.ok(html.includes(S.escape(text)));assert.doesNotMatch(html,/<script\b/i);
});
test('CRM 與 Live 動態文字和命令 ID 均轉義',()=>{
  const text='<svg onload="boom"> & \' "';
  const evilFixtures={...fixtures,contacts:[{...fixtures.contacts[0],id:text,name:text,tag:text,source:text}],events:[{...fixtures.events[0],id:text,name:text,time:text,status:text}]};
  for(const [group,sub,page,action] of [['contacts','contacts','contacts','contact'],['live','all','live','event']]) {
    const html=render({group,sub,page,fixtures:evilFixtures});
    assert.ok(html.includes(S.escape(text)));command(html,action,S.escape(text));
    assert.doesNotMatch(html,/<(?:img|svg|script)\b/i);
  }
});
test('render 多次使用同一深凍結 context，輸出穩定且不改快照',()=>{
  const ctx=context({page:'form',editing:bundle});
  assert.ok(Object.isFrozen(ctx.editing)&&Object.isFrozen(ctx.editing.courses)&&Object.isFrozen(ctx.fixtures.resources[0]));
  const before=JSON.stringify(ctx);
  const first=V.render(ctx),second=V.render(ctx);
  assert.equal(first,second);assert.equal(JSON.stringify(ctx),before);
  assert.match(first,/id=["']local-form["']/);
});
test('基本資料保留四個唯讀示範欄位，不提供假保存',()=>{
  const html=render({group:'settings',sub:'profile',page:'navigation-preview'});
  const fields=tags(html,'input');
  assert.deepEqual(fields.map(a=>a.value),['示範創作者','我的創作者工作室','creator@example.test','Asia/Taipei']);
  for(const field of fields) assert.ok(Object.hasOwn(field,'readonly'));
  for(const label of ['顯示名稱','品牌名稱','聯絡電子郵件','時區']) assert.ok(html.includes(label));
  assert.equal(tags(html,'button').length,0);boundary(html);
});
test('PAYUNi 保留收款版型、本機未連線與空白唯讀商店代號，不讀憑證',()=>{
  const sentinel='禁止讀取憑證';
  const html=render({group:'settings',sub:'payment',page:'navigation-preview',fixtures:{...fixtures,credentials:sentinel}});
  for(const text of ['PAYUNi','本機未連線，不扣款','商店代號','金鑰與加密資訊','不讀取真實金鑰']) assert.ok(html.includes(text));
  const fields=tags(html,'input');assert.equal(fields.length,1);
  assert.ok(Object.hasOwn(fields[0],'readonly'));assert.equal(fields[0].value??'','');
  assert.ok(!html.includes(sentinel));assert.equal(tags(html,'button').length,0);boundary(html);
  assert.doesNotMatch(fs.readFileSync(require.resolve('./creator-local-creator-view.js'),'utf8'),/credentials|process\.env|localStorage|sessionStorage|fetch\(/);
});
test('CRM 標籤保留 fixture 卡片及計數，轉義標籤且空名單不造資料',()=>{
  const html=render({group:'contacts',sub:'tags',page:'navigation-preview',fixtures:{...fixtures,contacts:[{...fixtures.contacts[0],tag:'<b>學員</b>'}, {...fixtures.contacts[1],tag:'<b>學員</b>'}]}});
  assert.match(html,/class="local-records"/);assert.ok(html.includes(S.escape('<b>學員</b>')));
  assert.match(html,/示範聯絡人：2 位/);assert.doesNotMatch(html,/<b>/);boundary(html);
  const blank=render({group:'contacts',sub:'tags',page:'navigation-preview',fixtures:{contacts:[]}});
  empty(blank);assert.doesNotMatch(blank,/示範聯絡人 [AB]/);
});
for(const sub of ['segments','consent']) test(`CRM ${sub} 保留同意分組與 fixture 名單，空資料不造人數`,()=>{
  const html=render({group:'contacts',sub,page:'navigation-preview'});
  for(const text of ['同意狀態分開管理','已同意行銷','尚未同意','示範聯絡人 A','示範聯絡人 B','1 位','不寄送行銷信']) assert.ok(html.includes(text));
  assert.match(html,/class="local-setting-row"/);boundary(html);
  const blank=render({group:'contacts',sub,page:'navigation-preview',fixtures:{contacts:[]}});
  empty(blank);assert.doesNotMatch(blank,/示範聯絡人 [AB]|1 位/);
});
for(const group of ['site','email','automation','sales']) for(const item of N.items('creator',group)) test(`${group}/${item.id} 提供示意列表欄位與空狀態，不只通用說明`,()=>{
  const html=render({group,sub:item.id,page:'navigation-preview'});
  assert.match(html,/<table\b/);assert.match(html,/<thead\b/);assert.match(html,/<tbody\b/);
  assert.ok(tags(html,'th').length>=3);empty(html);boundary(html);
  assert.equal(tags(html,'button').length,0);assert.equal(tags(html,'form').length,0);
});
