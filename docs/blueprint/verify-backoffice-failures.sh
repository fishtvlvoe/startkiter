#!/usr/bin/env bash
# 在頁面生命週期內注入storage failure並恢復，不修改原保存資料。
set -euo pipefail
ego-browser nodejs <<'EOF'
const fs=await import('node:fs');
const task=(await listTaskSpaces()).find(s=>s.name==='StartKiter creator blueprint 驗收');
if(!task||task.ownership!=='agent')throw Error('空間未交由Agent控制');await useOrCreateTaskSpace(task.id);
const tab=(await listTabs()).find(t=>decodeURI(t.url).includes('/startkiter/docs/blueprint/startkiter-creator-platform-progress-uiux.html'));
if(!tab)throw Error('找不到本機入口');await switchTab(tab.targetId);await gotoAndWait(tab.url.split('?')[0]+'?localAcceptance=1',{timeout:15});
const results=[];
function check(name,ok,detail){results.push({name,ok,detail});if(!ok)throw Error(name);}
async function tap(s){await js(`document.querySelector(${JSON.stringify(s)}).scrollIntoView({block:'center',behavior:'instant'})`);await click(s);}
const before=await js('localStorage.getItem(window.CreatorLocal.KEY)');
const canary=await js(`(()=>{const S=window.CreatorLocalShell,evil='<img src=x onerror="window.localCanary=1">';window.localCanary=0;const fixture={id:'canary',name:evil,type:'code',price:1200,billing:'once',period:null,status:'published',courses:[],kit:true,service:false};const c=S.context({role:'creator',group:'products',sub:'all',page:'products',data:{products:[fixture],acquired:[]},fixtures:{resources:window.CreatorLocal.resources},filters:{productKind:'all',productStatus:'all',productSearch:evil}});const b=S.context({role:'buyer',group:'buyer',sub:'library',page:'buyer',data:{products:[fixture],acquired:[fixture]},fixtures:{resources:window.CreatorLocal.resources},filters:{}});const a=S.context({role:'admin',group:'users',sub:'all-users',page:'navigation-preview',fixtures:{users:[{id:'canary',name:evil,role:'creator',status:'active'}]},filters:{userRole:'all'}});const box=document.createElement('div');box.hidden=true;document.body.append(box);box.innerHTML=window.CreatorLocalViews.creator.render(c)+window.CreatorLocalViews.buyer.render(b)+window.CreatorLocalViews.admin.render(a);const result={images:box.querySelectorAll('img').length,inlineEvents:[...box.querySelectorAll('*')].flatMap(e=>[...e.attributes]).filter(a=>/^on/i.test(a.name)).length,literal:box.textContent.includes(evil),executed:window.localCanary};box.remove();delete window.localCanary;return result})()`);
check('三角色DOM注入字串不執行',canary.images===0&&canary.inlineEvents===0&&canary.literal&&canary.executed===0,canary);
await tap('[data-local-action=module][data-id=products]');await tap('[data-local-action=new]');await fillInput('#local-name','儲存失敗驗收（不保存）');await fillInput('#local-price','1200');await tap('[name=courses][value=course-ai]');
await js("window.localOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error('canary-storage-denied')}");
try{await tap('#local-save');check('寫入失敗保留表單',await js("document.querySelector('#local-form-error').textContent.includes('尚未保存')&&document.querySelector('#local-name').value==='儲存失敗驗收（不保存）'"));}
finally{await js('Storage.prototype.setItem=window.localOriginalSet;delete window.localOriginalSet');}
check('寫入失敗沒有改存檔',await js('localStorage.getItem(window.CreatorLocal.KEY)')===before);
await js("window.localOriginalGet=Storage.prototype.getItem;Storage.prototype.getItem=function(key){return key===window.CreatorLocal.KEY?'{bad-json':window.localOriginalGet.call(this,key)}");
try{await tap('#local-save');check('資料損壞fail closed',await js("document.querySelector('#local-form-error').textContent.includes('停止保存')&&!!document.querySelector('#local-form')"));}
finally{await js('Storage.prototype.getItem=window.localOriginalGet;delete window.localOriginalGet');}
check('損壞探針不修改原bytes',await js('localStorage.getItem(window.CreatorLocal.KEY)')===before);
await js("const b=document.createElement('button');b.id='local-unknown-probe';b.dataset.localAction='execute-provider';b.textContent='未知命令探針';document.querySelector('#local-content').append(b)");
await tap('#local-unknown-probe');check('未知命令拒絕且不破壞輸入',await js("document.querySelector('#local-form-error').textContent.includes('不支援')&&document.querySelector('#local-name').value==='儲存失敗驗收（不保存）'"));await js("document.querySelector('#local-unknown-probe').remove()");
await tap('[data-local-action=module][data-id=settings]');await pressKey('Escape');check('Escape關閉確認且保留輸入',await js("!document.querySelector('#local-leave-dialog')&&document.querySelector('#local-name').value==='儲存失敗驗收（不保存）'"));
await tap('[data-local-action=module][data-id=settings]');await tap('[data-local-action=discard]');
check('探針結束原資料不變',await js('localStorage.getItem(window.CreatorLocal.KEY)')===before);
const evidence=fs.mkdtempSync('/Users/fishtv/Development/B-產品/products/startkiter/docs/blueprint/evidence/backoffice-failures-');fs.writeFileSync(evidence+'/result.json',JSON.stringify({scope:'注入失敗及實際DOM canary，不是正式資料或provider驗收',results},null,2));cliLog({pass:results.length,fail:0,evidence});
EOF
