#!/usr/bin/env bash
# 只驗本機 HTML 原型，不連正式資料／provider；完整 runtime gate 另驗。
set -euo pipefail
ego-browser nodejs <<'EOF'
const { mkdtempSync } = await import('node:fs');
const spaces = await listTaskSpaces();
const matches = spaces.filter(s => s.name === 'StartKiter creator blueprint 驗收');
const task = matches[0];
if (matches.length!==1 || task.ownership !== 'agent') {
  throw new Error('驗收空間不存在／名稱不符／非 agent 控制；停止，不自行 claim/takeover。');
}
await useOrCreateTaskSpace(task.id);
const tabs = await listTabs();
const report = tabs.find(t => t.url.startsWith('file:') && decodeURI(new URL(t.url).pathname).endsWith('/startkiter/docs/blueprint/startkiter-creator-platform-progress-uiux.html'));
if (!report) throw new Error('本機報告分頁不存在；停止，不自行開其它專案或正式站。');
await switchTab(report.targetId);
// 本機操作版與舊畫面提案共用一個分頁，舊腳本明確切回原提案。
await gotoAndWait(report.url.split('?')[0].split('#')[0]+'?localAcceptance=0', { timeout: 15 });
const shotsDir = mkdtempSync('/tmp/startkiter-blueprint-ui.');
const results = [];
function check(name, ok, detail) {
  results.push({name, status:ok?'PASS':'FAIL', detail});
  cliLog(JSON.stringify({type:'assertion',name,status:ok?'PASS':'FAIL',detail}));
  if (!ok) throw new Error(name + ': ' + JSON.stringify(detail));
}
async function read(code) { return await js(code); }
async function tap(selector) {
  await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
  await wait(.2);
  await click(selector);
  await wait(.2);
}
async function nativePick(selector, text, expected) {
  await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'});document.querySelector(${JSON.stringify(selector)}).focus()`);
  await wait(1.1);
  const before = await js(`document.querySelector(${JSON.stringify(selector)}).value`);
  for (const char of text) {
    await cdp('Input.dispatchKeyEvent',{type:'char',key:char,text:char,unmodifiedText:char});
  }
  await wait(.2);
  const after = await js(`document.querySelector(${JSON.stringify(selector)}).value`);
  check('原生 typeahead '+selector, after === expected, {before,after,expected,changed:before!==after});
}
async function view(name, width) {
  if (width === 390) {
    const keys={overview:'儀',courses:'課',offers:'商',contacts:'聯',live:'直'};
    await nativePick('#demo-mobile-nav', keys[name], name);
  } else if (name === 'courses' || name === 'offers') {
    await tap('[data-demo-menu-toggle="products"]');
    await tap('.demo-menu-panel [data-demo-view="'+name+'"]');
  } else if (name === 'contacts') {
    await tap('[data-demo-menu-toggle="contacts"]');
    await tap('.demo-menu-panel [data-demo-view="contacts"]');
  } else {
    await tap('.demo-nav [data-demo-view="'+name+'"]');
  }
  const current=await read("document.querySelector('#creator-admin-demo').dataset.currentView");
  check('切換 '+name, current===name, {current,width});
}
async function shot(name) {
  await js("document.querySelector('#creator-admin-demo').scrollIntoView({block:'start',behavior:'instant'})");
  await wait(.2);
  await captureScreenshot(shotsDir+'/'+name+'.png');
}
for (const width of [1440,390]) {
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await cdp('Page.reload');await wait(.4);
  await shot(width+'-overview');
  await view('courses',width);
  await tap('[data-demo-filter="draft"]');
  await fillInput('[data-demo-search="courses"]','AI');await wait(.2);
  const empty=await read("({empty:!document.querySelector('#demo-course-empty').hidden,visible:[...document.querySelectorAll('[data-course-state]')].filter(e=>!e.hidden).length})");
  check('草稿＋AI 無匹配',empty.empty&&empty.visible===0,empty);
  await shot(width+'-empty');
  await tap('[data-demo-clear-search]');
  const reset=await read("({query:document.querySelector('[data-demo-search=\"courses\"]').value,filter:document.querySelector('[data-demo-filter][aria-pressed=\"true\"]').dataset.demoFilter,focus:document.activeElement.getAttribute('data-demo-search')})");
  check('清條件與焦點',reset.query===''&&reset.filter==='all'&&reset.focus==='courses',reset);
  await view('offers',width);await shot(width+'-offers');
  for (const [key,name,type,price] of [['course','單堂課程','course','8800'],['bundle','創作者工具組合包','bundle',''],['kit','CodePackage 獨立販售','code','']]) {
    const list=width===390?'.demo-cards':'.demo-table';
    await tap('[data-demo-page="offers"] '+list+' [data-demo-offer="'+key+'"]');
    const record=await read("({name:document.querySelector('[name=\"offerName\"]').value,type:document.querySelector('[name=\"productType\"]').value,price:document.querySelector('[name=\"price\"]').value,course:document.querySelector('[name=\"grantCourses\"]').checked,kit:document.querySelector('[name=\"grantKit\"]').checked})");
    check('回填 '+key,record.name===name&&record.type===type&&record.price===price,record);
    if (key==='kit') check('獨立包不暗授課',!record.course&&record.kit,record);
    await tap('[data-demo-page="offer-form"] .demo-back');
  }
  await tap('[data-demo-page="offers"] .admin-action');
  check('建立清空',await read("document.querySelector('[name=\"offerName\"]').value===''&&document.querySelector('[name=\"price\"]').value===''") , {width});
  await tap('#demo-preview-offer');
  check('無名稱拒絕預覽',await read("document.querySelector('[name=\"offerName\"]').getAttribute('aria-invalid')==='true'&&document.activeElement.name==='offerName'"),{width});
  await fillInput('[name="offerName"]','原型驗收方案');
  await fillInput('[name="price"]','0');
  await tap('#demo-preview-offer');
  check('零價格與保留輸入',await read("document.querySelector('[name=\"price\"]').getAttribute('aria-invalid')==='true'&&document.querySelector('[name=\"offerName\"]').value==='原型驗收方案'"),{width});
  await fillInput('[name="price"]','8,800');
  await tap('#demo-preview-offer');
  check('有效原型預覽',await read("document.querySelector('#demo-offer-message').innerText.includes('沒有儲存或發布')&&document.querySelector('[name=\"price\"]').getAttribute('aria-invalid')===null"),{width});
  await shot(width+'-form');
  await tap('[data-demo-page="offer-form"] .demo-back');
  await view('contacts',width);await shot(width+'-contacts');
  await view('live',width);
  for (const [kind,count] of [['live',1],['evergreen',1],['all',2]]) {
    await tap('[data-demo-live-filter="'+kind+'"]');
    const state=await read("({pressed:document.querySelector('[data-demo-live-filter][aria-pressed=\"true\"]').dataset.demoLiveFilter,visible:[...document.querySelectorAll('[data-demo-live-kind]')].filter(e=>!e.hidden).map(e=>e.dataset.demoLiveKind)})");
    check('直播類型 '+kind,state.pressed===kind&&state.visible.length===count&&(kind==='all'||state.visible.every(v=>v===kind)),state);
  }
  await shot(width+'-live');
  await nativePick('#demo-ui-state','讀','error');
  check('原生讀取失敗畫面',await read("!document.querySelector('#demo-state-panel').hidden&&document.querySelector('.admin-layout').hidden"),{width});
  await tap('#demo-state-recover');
  check('恢復正常與焦點',await read("document.querySelector('#demo-ui-state').value==='normal'&&document.activeElement.id==='demo-ui-state'&&!document.querySelector('.admin-layout').inert"),{width});
  const dimensions=await read("({viewport:innerWidth,page:document.documentElement.scrollWidth})");
  check('無水平溢出',dimensions.page<=dimensions.viewport,dimensions);
}
cliLog(JSON.stringify({type:'summary',scope:'本機原型；不是正式資料/付款/寄信/授權/部署驗收',pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,screenshots:shotsDir,unverified:['原生ArrowDown彈出選單','完整Tab/Shift+Tab/Escape/focus trap','真正保存與全部欄位同時錯誤','登入角色／跨workspace／server denial','未施工模組/provider/rollback']}));
EOF
