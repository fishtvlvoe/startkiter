#!/usr/bin/env bash
# 三角色本機整合驗收；只使用已知fixture，不修改真實資料或其他工作空間。
set -euo pipefail
ego-browser nodejs <<'EOF'
const fs=await import('node:fs');
const task=(await listTaskSpaces()).find(s=>s.name==='StartKiter creator blueprint 驗收');
if(!task||task.ownership!=='agent')throw Error('驗收空間不是Agent控制，停止');
await useOrCreateTaskSpace(task.id);
const tab=(await listTabs()).find(t=>decodeURI(t.url).includes('/startkiter/docs/blueprint/startkiter-creator-platform-progress-uiux.html'));
if(!tab)throw Error('找不到指定本機入口');await switchTab(tab.targetId);
const base=tab.url.split('?')[0].split('#')[0]+'?localAcceptance=1&candidate=1';
const evidence=fs.mkdtempSync('/Users/fishtv/Development/B-產品/products/startkiter/docs/blueprint/evidence/backoffice-integration-');
const results=[];
function check(name,ok,detail){results.push({name,ok,detail});fs.writeFileSync(evidence+'/result.json',JSON.stringify({scope:'三角色本機示範；不代表正式授權／provider',results},null,2));if(!ok)throw Error(name+': '+JSON.stringify(detail));}
async function tap(s){await js(`document.querySelector(${JSON.stringify(s)}).scrollIntoView({block:'center',behavior:'instant'})`);await click(s);}
async function submenu(id){if(!await js('document.querySelector(".local-sidebar").open'))await tap('.local-sidebar summary');await tap('.local-sidebar [data-local-action=submenu][data-id="'+id+'"]');}
async function shot(name){await js('window.scrollTo(0,0)');await captureScreenshot(evidence+'/'+name+'.png');}
const before=await js('localStorage.getItem(window.CreatorLocal.KEY)');
for(const width of [1440,390]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width===390});await gotoAndWait(base,{timeout:15});
  check('新版角色view '+width,await js("document.querySelector('#local-workspace').dataset.renderMode==='views'"));
  await shot(width+'-creator-home');
  await tap('[data-local-action=role]');await tap('[data-local-action=module][data-id=users]');
  check('管理員清單 '+width,await js("document.querySelector('#local-admin-users').textContent.includes('Demo Creator')&&document.querySelector('#local-admin-users').textContent.includes('Demo Buyer')"));
  await tap('[data-local-action=filter][data-id="user-role:creator"]');
  check('管理員角色篩選 '+width,await js("document.querySelector('#local-admin-users').textContent.includes('Demo Creator')&&!document.querySelector('#local-admin-users').textContent.includes('Demo Buyer')"));
  await tap('[data-local-action=show-detail][data-id="user:user-creator"]');
  check('管理員詳情 '+width,await js("document.querySelector('#local-content').textContent.includes('Demo Creator')"));await shot(width+'-admin-detail');
  await tap('[data-local-action=back]');
  check('返回保留角色篩選 '+width,await js("!document.querySelector('#local-admin-users').textContent.includes('Demo Buyer')"));
  await fillInput('#local-admin-search','不存在');
  check('管理員搜尋空態 '+width,await js("document.querySelector('#local-admin-users').textContent.match(/沒有|查無|空|找不到/)!==null"));
  await fillInput('#local-admin-search','');await tap('[data-local-action=module][data-id=modules]');
  await tap('[data-local-action=show-detail][data-id="module:course"]');
  check('版本詳情無真升級 '+width,await js("document.querySelector('#local-content').textContent.includes('demo-1')&&document.querySelector('#local-content').textContent.includes('未串接')"));await shot(width+'-admin-module');await tap('[data-local-action=back]');
  await tap('[data-local-action=role]');await tap('[data-local-action=module][data-id=products]');
  await submenu('code');check('程式包子選單 '+width,await js("[...document.querySelectorAll('#local-products [data-product-id]')].every(e=>window.CreatorLocal.load(localStorage).data.products.find(p=>p.id===e.dataset.productId).type==='code')"));
  await tap('[data-local-action=new]');await fillInput('#local-name','未儲存保護 '+width);await tap('[data-local-action=module][data-id=settings]');
  check('未儲存先確認 '+width,await js("document.querySelector('#local-leave-dialog')?.open===true&&document.querySelector('#local-workspace').dataset.group==='products'"));await shot(width+'-unsaved-confirm');
  await tap('[data-local-action=stay]');check('留下保留輸入與焦點 '+width,await js(`document.querySelector('#local-name').value==='未儲存保護 ${width}'&&document.activeElement.id==='local-name'`));
  await tap('[data-local-action=module][data-id=settings]');await tap('[data-local-action=discard]');
  check('放棄後切換 '+width,await js("document.querySelector('#local-workspace').dataset.group==='settings'"));await shot(width+'-creator-settings');
  await tap('[data-local-action=nav][data-id=buyer]');
  check('買家沒有管理員控制 '+width,await js("document.querySelector('.local-role').textContent==='買家預覽'&&!document.querySelector('[data-local-action=role]')&&!document.querySelector('[data-local-action=module][data-id=users]')"));await shot(width+'-buyer');
  await submenu('catalog');check('買家可取得清單 '+width,await js("!!document.querySelector('[data-local-action=acquire]')"));
  check('三角色view仍有效 '+width,await js("document.querySelector('#local-workspace').dataset.renderMode==='views'"));
  check('導航不動保存資料 '+width,await js('localStorage.getItem(window.CreatorLocal.KEY)')===before);
  check('无水平溢出 '+width,await js('document.documentElement.scrollWidth<=innerWidth'));
}
await gotoAndWait(base+'&legacy=1',{timeout:15});
check('舊版回退入口保留',await js("document.querySelector('#local-workspace').dataset.renderMode==='legacy'"));
await gotoAndWait(base,{timeout:15});
await cdp('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
cliLog({pass:results.length,fail:0,evidence});
EOF
