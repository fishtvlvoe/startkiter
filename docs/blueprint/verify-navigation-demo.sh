#!/usr/bin/env bash
# 兩層導航示意檢查，完全不修改本機商品或外部資料。
set -euo pipefail
ego-browser nodejs <<'EOF'
const fs=await import('node:fs');
const task=(await listTaskSpaces()).find(s=>s.name==='StartKiter creator blueprint 驗收');
if(!task||task.ownership!=='agent')throw Error('驗收空間尚未交由Agent控制');
await useOrCreateTaskSpace(task.id);
const tab=(await listTabs()).find(t=>decodeURI(t.url).includes('/startkiter/docs/blueprint/startkiter-creator-platform-progress-uiux.html'));
if(!tab)throw Error('本機Demo分頁不存在');await switchTab(tab.targetId);
const url=tab.url.split('?')[0].split('#')[0]+'?localAcceptance=1'+(tab.url.includes('candidate=1')?'&candidate=1':'');
const evidence=fs.mkdtempSync('/Users/fishtv/Development/B-產品/products/startkiter/docs/blueprint/evidence/navigation-demo-');
const results=[];
function check(name,ok,detail){results.push({name,ok,detail});fs.writeFileSync(evidence+'/result.json',JSON.stringify({scope:'本機導航示意，非正式角色或設定驗收',results},null,2));if(!ok)throw Error(name+': '+JSON.stringify(detail));}
async function tap(s){await js(`document.querySelector(${JSON.stringify(s)}).scrollIntoView({block:'center',behavior:'instant'})`);await click(s);}
async function sub(id){if(!await js('document.querySelector(".local-sidebar").open'))await tap('.local-sidebar summary');await tap('[data-local-action=submenu][data-id="'+id+'"]');}
async function shot(name){await js('window.scrollTo(0,0)');await captureScreenshot(evidence+'/'+name+'.png');}
const before=await js('localStorage.getItem(window.CreatorLocal.KEY)');
for(const width of [1440,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await gotoAndWait(url,{timeout:15});
  check('創作者角色標示 '+width,await js("document.querySelector('.local-role').textContent==='創作者後台'"));
  const expected={overview:['home'],contacts:['contacts','tags','segments','consent'],site:['pages','funnels','forms'],email:['campaigns','templates','delivery'],automation:['rules','workflows','execution'],products:['all','course','bundle','code','saas'],sales:['orders','subscriptions','refunds','coupons'],live:['all','live','evergreen','replays'],settings:['profile','account','payment','subscription','email','domains','integrations']};
  for(const [group,items]of Object.entries(expected)){
    await tap('[data-local-action=module][data-id="'+group+'"]');
    const actual=await js("[...document.querySelectorAll('.local-sidebar [data-local-action=submenu]')].map(b=>b.dataset.id)");
    check('情境子選單 '+group+' '+width,JSON.stringify(actual)===JSON.stringify(items),actual);
    for(const id of items){
      await sub(id);
      const loc=await js("({group:document.querySelector('#local-workspace').dataset.group,sub:document.querySelector('.local-sidebar [aria-current=page]')?.dataset.id,heading:document.querySelector('#local-heading')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth})");
      check('子功能 '+group+'/'+id+' '+width,loc.group===group&&loc.sub===id&&!!loc.heading&&!loc.overflow,loc);
      if(group==='products'&&id!=='all')check('商品種類 '+id+' '+width,await js(`(()=>{const cards=[...document.querySelectorAll('#local-products [data-product-id]')];return cards.length>0&&cards.every(el=>window.CreatorLocal.load(localStorage).data.products.find(p=>p.id===el.dataset.productId).type===${JSON.stringify(id)})})()`));
    }
  }
  await tap('[data-local-action=module][data-id=products]');await shot(width+'-products');
  await sub('code');await shot(width+'-code');
  await tap('[data-local-action=module][data-id=settings]');await shot(width+'-settings-profile');
  await sub('payment');await shot(width+'-settings-payment');
  await tap('[data-local-action=role]');
  check('平台管理員示意 '+width,await js("document.querySelector('.local-role').textContent==='平台管理員示意'"));
  await tap('[data-local-action=module][data-id=users]');
  check('管理員專用子選單 '+width,await js("JSON.stringify([...document.querySelectorAll('.local-sidebar [data-local-action=submenu]')].map(b=>b.dataset.id))==='[\"all-users\",\"roles\"]'"));
  await shot(width+'-admin');await sub('roles');
  check('角色不冒充授權 '+width,await js("document.querySelector('#local-content').innerText.includes('未串接')"));
  await tap('[data-local-action=role]');await tap('[data-local-action=nav][data-id=buyer]');
  check('買家獨立標示 '+width,await js("document.querySelector('.local-role').textContent==='買家預覽'"));
  check('導航不改商品 '+width,await js('localStorage.getItem(window.CreatorLocal.KEY)')===before);
}
cliLog({pass:results.length,fail:0,evidence});
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await gotoAndWait(url,{timeout:15});
await tap('[data-local-action=module][data-id=products]');
EOF
