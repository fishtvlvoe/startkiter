#!/usr/bin/env bash
# 只使用本機示範資料；保留既有資料，不觸碰其他工作空間。
set -euo pipefail
ego-browser nodejs <<'EOF'
const fs=await import('node:fs');
const task=(await listTaskSpaces()).find(s=>s.name==='StartKiter creator blueprint 驗收');
if(!task || task.ownership!=='agent')throw Error('本機驗收工作空間未交由 Agent 控制；停止。');
await useOrCreateTaskSpace(task.id);
const tab=(await listTabs()).find(t=>decodeURI(t.url).includes('/startkiter/docs/blueprint/startkiter-creator-platform-progress-uiux.html'));
if(!tab)throw Error('找不到指定本機報告分頁。');
await switchTab(tab.targetId);
const url=tab.url.split('?')[0].split('#')[0]+'?localAcceptance=1'+(tab.url.includes('candidate=1')?'&candidate=1':'');
await gotoAndWait(url,{timeout:15});
const base='/Users/fishtv/Development/B-產品/products/startkiter/docs/blueprint/evidence';
const evidence=fs.mkdtempSync(base+'/local-acceptance-');
const results=[];
function check(name,actual,expected=true){const pass=JSON.stringify(actual)===JSON.stringify(expected);results.push({name,pass,actual,expected});fs.writeFileSync(evidence+'/result.json',JSON.stringify({scope:'本機示範',results},null,2));cliLog({name,pass,actual,expected});if(!pass)throw Error(name);}
async function tap(selector){await js(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);await wait(.2);await click(selector);await wait(.1);}
async function nav(id){if(id!=='buyer'&&await js("document.querySelector('#local-workspace').dataset.group==='buyer'"))await tap('[data-local-action=nav][data-id=overview]');await tap('#local-workspace [data-local-action='+(id==='buyer'?'nav':'module')+'][data-id="'+id+'"]');}
async function shot(name){await js('window.scrollTo(0,0)');await captureScreenshot(evidence+'/'+name+'.png');}
const run=Date.now().toString(36);
for(const width of [1440,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await cdp('Page.reload');await wait(.4);
  check('本機入口 '+width,await js("!!document.querySelector('#local-workspace')"));
  await shot(width+'-home');
  for(const [type,period] of [['course','once'],['bundle','quarter'],['code','month'],['saas','year']]){
    await nav('products');await tap('[data-local-action=new]');
    // 必須有欄位錯誤，不可假報成功。
    await tap('#local-save');
    check('空名稱錯誤 '+type+' '+width,await js("document.activeElement.id"),'local-name');
    const name='驗收示範 '+width+' '+type+' '+run;
    await fillInput('#local-name',name);await fillInput('#local-price','1,200');
    await tap('[name=type][value="'+type+'"]');
    if(period!=='once'){await tap('[name=billing][value=subscription]');await tap('[name=period][value="'+period+'"]');}
    if(type==='course'||type==='bundle')await tap('[name=courses][value=course-ai]');
    if(type==='bundle')await tap('[name=courses][value=course-saas]');
    await tap('[name=status][value=published]');
    await shot(width+'-'+type+'-form');
    await tap('#local-save');
    check('保存回列表 '+type+' '+width,await js("document.querySelector('#local-workspace').dataset.page"),'products');
    const id=await js(`Array.from(document.querySelectorAll('[data-product-id]')).find(e=>e.textContent.includes(${JSON.stringify(name)}))?.dataset.productId`);
    check('列表存在 '+type+' '+width,!!id);
    await cdp('Page.reload');await wait(.4);await nav('products');
    await tap('[data-local-action=edit][data-id="'+id+'"]');
    const read=await js("(()=>{const f=document.querySelector('#local-form');return {name:f.elements.name.value,type:f.elements.type.value,price:f.elements.price.value,billing:f.elements.billing.value,period:f.elements.period.value,courses:Array.from(f.querySelectorAll('[name=courses]:checked')).map(i=>i.value),kit:f.elements.kit.checked,service:f.elements.service.checked}})()");
    check('重整回填 '+type+' '+width,read,{name,type,price:'1200',billing:period==='once'?'once':'subscription',period:period==='once'?'month':period,courses:type==='course'?['course-ai']:type==='bundle'?['course-ai','course-saas']:[],kit:type==='code',service:type==='saas'});
    // 錯誤價格保留已填名稱。
    await fillInput('#local-price','1,20');await tap('#local-save');
    check('價格錯誤與保留 '+type+' '+width,await js("({focus:document.activeElement.id,name:document.querySelector('#local-name').value})"),{focus:'local-price',name});
    await fillInput('#local-price','1200');await tap('#local-save');
    check('修正後保存回列表 '+type+' '+width,await js("document.querySelector('#local-workspace').dataset.page"),'products');
    await nav('buyer');await tap('[data-local-action=acquire][data-id="'+id+'"]');
    const acquired=await js(`document.querySelector('[data-acquired-id="${id}"]').innerText`);
    check('取得指定內容 '+type+' '+width,type==='bundle'?acquired.includes('AI 自動化入門')&&acquired.includes('用 AI 建立會員服務')&&!acquired.includes('打造第一個線上產品'):type==='code'?acquired.includes('程式碼包')&&!acquired.includes('AI 自動化入門'):type==='saas'?acquired.includes('SaaS')&&!acquired.includes('AI 自動化入門'):acquired.includes('AI 自動化入門')&&!acquired.includes('用 AI 建立會員服務'));
    await tap('[data-local-action=acquire][data-id="'+id+'"]');
    check('不重複取得 '+type+' '+width,await js(`document.querySelectorAll('[data-acquired-id="${id}"]').length`),1);
    await cdp('Page.reload');await wait(.4);await nav('buyer');
    check('取得重整保留 '+type+' '+width,await js(`!!document.querySelector('[data-acquired-id="${id}"]')`));
  }
  await shot(width+'-buyer');
  await nav('products');await fillInput('#local-search','不存在的驗收商品');
  check('搜尋空狀態 '+width,await js("document.querySelector('#local-products').innerText.includes('沒有符合')"));
  await fillInput('#local-search','');await tap('[data-local-action=filter][data-id=draft]');
  check('草稿篩選 '+width,await js("[...document.querySelectorAll('#local-products .demo-record')].every(e=>e.innerText.includes('草稿'))"));
  await tap('[data-local-action=filter][data-id=all]');await shot(width+'-products');
  await nav('contacts');await tap('[data-local-action=contact-filter][data-id=no]');
  check('CRM 同意篩選 '+width,await js("document.querySelectorAll('#local-contacts .demo-record').length"),1);
  await tap('[data-local-action=contact][data-id=contact-two]');
  check('CRM 詳情 '+width,await js("document.querySelector('#local-content').innerText.includes('未同意，不可寄送')"));
  await shot(width+'-contact-detail');await tap('#local-content [data-local-action=back],#local-content [data-local-action=nav]');
  await nav('live');await tap('[data-local-action=live-filter][data-id=evergreen]');
  check('常青篩選 '+width,await js("document.querySelectorAll('#local-events .demo-record').length"),1);
  await tap('[data-local-action=event][data-id=evergreen-one]');
  check('常青詳情 '+width,await js("/供應商.*未串接/.test(document.querySelector('#local-content').innerText)"));
  await shot(width+'-live-detail');await tap('#local-content [data-local-action=back],#local-content [data-local-action=nav]');
  check('無水平溢出 '+width,await js('document.documentElement.scrollWidth<=innerWidth'));
  await nav('products');await tap('[data-local-action=new]');
  await pressKey('Tab');
  check('Tab 先到返回列表 '+width,await js('document.activeElement.dataset.localAction'),'nav');
  await pressKey('Tab');
  check('Tab 進入名稱 '+width,await js('document.activeElement.id'),'local-name');
  await nav('overview');
}
fs.writeFileSync(evidence+'/result.json',JSON.stringify({scope:'本機示範，不是正式付款／授權／provider 驗收',results,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length},null,2));
cliLog({summary:results.length,pass:results.filter(r=>r.pass).length,evidence});
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await cdp('Page.reload');
EOF
