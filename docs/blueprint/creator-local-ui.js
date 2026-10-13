// 沿用報告後台的樣式，隔離本機資料與正式系統。
(function () {
  if(new URLSearchParams(location.search).get('localAcceptance')!=='1')return;
  if(new URLSearchParams(location.search).get('legacy')==='1' || !['admin','creator','buyer'].every(r=>typeof window.CreatorLocalViews?.[r]?.render==='function')) {
    const script=document.createElement('script');script.src='creator-local-legacy-ui.js';document.head.append(script);return;
  }
  window.CreatorLocalViewsEnabled=true;
  const M=window.CreatorLocal, N=window.CreatorLocalNavigation, S=window.CreatorLocalShell, host=document.getElementById('local-acceptance');
  if(!M || !host)return;
  const css=document.createElement('style');
  css.textContent=`body.local-acceptance .wrap{max-width:1380px;width:100%;padding:20px;box-sizing:border-box}body.local-acceptance .wrap>header,body.local-acceptance .wrap>nav,body.local-acceptance .wrap>footer,body.local-acceptance main>section:not(#local-acceptance){display:none}#local-acceptance{margin:0}#local-workspace [hidden]{display:none!important}#local-workspace .demo-nav{display:flex;flex-wrap:wrap}#local-workspace .demo-form fieldset{min-width:0;border:1px solid var(--g300);border-radius:6px;padding:12px}#local-workspace .demo-form legend{font-weight:700;font-size:14px}#local-workspace .demo-form input[type=radio],#local-workspace .demo-form input[type=checkbox]{width:auto}#local-workspace .demo-check{font-size:13px}#local-workspace .local-choice{display:flex;flex-wrap:wrap;gap:8px}#local-workspace .demo-form label{font-size:14px}#local-workspace .demo-form input,#local-workspace .demo-form select{font-size:15px}#local-workspace button{font-size:14px}#local-workspace .local-records{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:12px}#local-workspace .demo-record{min-width:0;overflow-wrap:anywhere}#local-workspace .local-actions{display:flex;flex-wrap:wrap;gap:8px}#local-workspace .local-actions button{width:auto}#local-workspace .local-library{display:grid;gap:10px}#local-workspace h3:focus{outline:none}#local-workspace button:focus-visible,#local-workspace input:focus-visible{outline:3px solid var(--clay);outline-offset:2px}#local-workspace .local-alert{padding:12px;background:var(--red-soft);color:var(--red);border-radius:5px}#local-workspace .local-subtitle{font-size:14px;color:var(--g700)}#local-workspace .local-banner{padding:12px 20px;background:var(--yellow-soft);font-size:13px}#local-workspace .demo-filter button[aria-pressed=true]{background:var(--clay-soft);border-color:var(--clay)}@media(max-width:520px){body.local-acceptance .wrap{padding:8px}#local-workspace .local-records{grid-template-columns:1fr}#local-workspace .demo-nav button{flex:1 1 28%;padding:10px 5px}#local-workspace .admin-chrome{flex-wrap:wrap}#local-workspace .local-banner{padding:10px 14px}#local-workspace .demo-form-actions{flex-wrap:wrap}}`;
  document.head.append(css);document.body.classList.add('local-acceptance');host.hidden=false;
  document.title='StartKiter · 本機後台驗收';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let store;
  try {store=window.localStorage;}catch{store={getItem:()=>{throw Error('denied');}};}
  let loaded=M.load(store), data=loaded.ok?loaded.data:{products:[],acquired:[]};
  let page='overview', editing=null, message='', filter='all', term='';
  let role='creator', group='overview', sub='home', productKind='all';
  let userRole='all', userSearch='', detailId='', detailReturn=null;
  let formBaseline='', pendingNavigation=null;
  const adminUsers=[{id:'user-creator',name:'Demo Creator',role:'creator',status:'active'},{id:'user-buyer',name:'Demo Buyer',role:'buyer',status:'active'}];
  const adminModules=[{id:'course',name:'課程模組',version:'demo-1',status:'示範'},{id:'commerce',name:'商品與交付模組',version:'demo-1',status:'示範'}];
  const navigationCss=document.createElement('style');
  navigationCss.textContent=`#local-workspace .local-two-column{display:grid;grid-template-columns:230px minmax(0,1fr);background:#fbfaf7;min-height:580px}#local-workspace .local-sidebar{margin:24px 0 24px 20px;border:1px solid var(--g200);border-radius:7px;background:#fff;align-self:start}#local-workspace .local-sidebar summary{font-size:14px;padding:16px;color:var(--g500)}#local-workspace .local-sidebar nav{display:grid}#local-workspace .local-sidebar button{border:0;border-radius:0;text-align:left;padding:15px 18px;border-top:1px solid var(--g200);background:#fff;color:var(--g700);cursor:pointer}#local-workspace .local-sidebar button[aria-current=page]{border-left:4px solid var(--clay);padding-left:14px;background:var(--clay-soft);color:var(--clay-d);font-weight:700}#local-workspace .local-sidebar small{display:block;padding:14px 18px;color:var(--g500)}#local-workspace .local-two-column>.demo-page{margin:24px;background:#fff;border:1px solid var(--g200);border-radius:7px}#local-workspace .local-location{font-size:12px;color:var(--g500);margin-bottom:20px}#local-workspace .local-top-label{padding:8px 14px;font-size:12px;color:var(--g500);border-bottom:1px solid var(--g200)}#local-workspace .local-role{padding:4px 10px;background:var(--clay-soft);border-radius:4px;color:var(--clay-d);font-size:12px}#local-workspace .admin-context{flex-wrap:wrap;justify-content:flex-end}#local-workspace .local-explainer{font-size:14px;line-height:1.8}#local-workspace .local-setting-row{display:grid;grid-template-columns:160px minmax(0,1fr);gap:18px;border-bottom:1px solid var(--g200);padding:18px 0;font-size:14px}#local-workspace .local-setting-row input{width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--g300);border-radius:5px;background:#fafafa;color:var(--g700)}#local-workspace .demo-nav button{padding:12px 10px}#local-workspace .local-setting-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}#local-workspace .local-setting-grid label{font-size:14px;display:grid;gap:9px}#local-workspace .local-setting-grid input{padding:12px;border:1px solid var(--g300);border-radius:5px;min-width:0}#local-workspace .local-nav-tip{font-size:12px;color:var(--g500);padding:12px 20px;background:#fff;border-bottom:1px solid var(--g200)}@media(max-width:760px){#local-workspace .local-two-column{grid-template-columns:minmax(0,1fr)}#local-workspace .local-sidebar{margin:12px 12px 0}#local-workspace .local-two-column>.demo-page{margin:12px}#local-workspace .demo-nav button{flex:1 1 28%;white-space:normal}#local-workspace .local-setting-grid{grid-template-columns:1fr}#local-workspace .local-setting-row{grid-template-columns:1fr;gap:8px}}`;
  document.head.append(navigationCss);
  const readableCards=document.createElement('style');
  readableCards.textContent=`#local-workspace .local-records{grid-template-columns:repeat(auto-fit,minmax(285px,1fr))}#local-workspace .demo-record li{font-size:14px;line-height:1.7}#local-workspace .demo-record .demo-status{font-size:12px}#local-workspace .demo-record-title{font-size:16px}#local-workspace .local-sidebar small{font-size:13px;line-height:1.7}@media(max-width:520px){#local-workspace .local-records{grid-template-columns:minmax(0,1fr)}}`;
  document.head.append(readableCards);
  const dialogStyle=document.createElement('style');
  dialogStyle.textContent='#local-leave-dialog{width:min(480px,calc(100vw - 48px));box-sizing:border-box;padding:24px;border:1px solid var(--g300);border-radius:8px;background:var(--paper);color:var(--slate)}#local-leave-dialog::backdrop{background:rgba(20,20,19,.3)}#local-leave-dialog p{font-size:15px;line-height:1.7}';
  document.head.append(dialogStyle);
  const tableStyle=document.createElement('style');
  tableStyle.textContent='#local-workspace table{min-width:0;width:100%;table-layout:fixed}#local-workspace table caption{text-align:left;font-size:14px;padding:12px 0}#local-workspace th,#local-workspace td{font-size:13px;padding:12px 8px;overflow-wrap:anywhere}#local-workspace td .demo-empty{font-size:14px;padding:16px 8px}#local-workspace td p{font-size:14px;line-height:1.7}';
  document.head.append(tableStyle);
  const contentType=document.createElement('style');
  contentType.textContent='#local-workspace .demo-record h4,#local-workspace .demo-panel h4{font-size:16px;line-height:1.5;margin:0 0 10px}#local-workspace .demo-record p,#local-workspace .demo-panel>p{font-size:14px;line-height:1.7;margin:8px 0}';
  document.head.append(contentType);
  const contacts=[{id:'contact-one',name:'示範聯絡人 A',source:'課程報名',consent:'yes',tag:'課程學員'},{id:'contact-two',name:'示範聯絡人 B',source:'網站表單',consent:'no',tag:'新名單'}];
  const events=[{id:'live-one',name:'每週創作者問答',kind:'live',time:'10 月 18 日 19:30',status:'已排程'},{id:'evergreen-one',name:'自動化入門說明會',kind:'evergreen',time:'報名後依規則安排觀看',status:'草稿'}];
  let contactFilter='all',contactTerm='',liveFilter='all',liveTerm='';
  const btn=(label,action,id='',cls='row-action')=>`<button type="button" class="${cls}" data-local-action="${action}"${id?` data-id="${esc(id)}"`:''}>${label}</button>`;
  function header(title,desc,action=''){return `<div class="demo-page-head"><div><h3 tabindex="-1" id="local-heading">${title}</h3><p>${desc}</p></div>${action}</div>`;}
  function render(){
    detailId=page==='detail'?detailId:'';
    const nav=N.groups(role), children=N.items(role,group), label=nav.find(g=>g.id===group)?.label||'買家預覽', child=children.find(i=>i.id===sub)?.label||label;
    host.innerHTML=`<div class="admin-demo" id="local-workspace" data-page="${page}" data-role="${role}" data-group="${group}"><div class="admin-chrome"><div class="admin-brand"><span class="brand-mark">SK</span><span>StartKiter</span><span class="local-role">${page==='buyer'?'買家預覽':role==='admin'?'平台管理員示意':'創作者後台'}</span></div><div class="admin-context">${btn(role==='admin'?'切回創作者':'平台管理員示意','role')}${btn('預覽買家畫面','nav','buyer')}<a class="row-action" href="startkiter-creator-platform-progress-uiux.html">總計畫</a></div></div><div class="local-banner">本機示範：商品可保存；付款、寄信、直播、GitHub 與正式權限未串接。管理員及未施工模組僅供畫面驗收。</div><div class="local-top-label">1 · 上方主分類：選擇你要處理的業務</div><nav class="demo-nav" aria-label="本機後台主分類">${nav.map(g=>`<button type="button" data-local-action="module" data-id="${g.id}" ${group===g.id?'aria-current="page"':''}>${g.label}</button>`).join('')}</nav><div class="local-two-column"><details class="local-sidebar" ${innerWidth>760?'open':''}><summary>2 · ${label}的功能選單</summary><nav aria-label="${label}子選單">${children.map(i=>`<button type="button" data-local-action="submenu" data-id="${i.id}" ${sub===i.id?'aria-current="page"':''}>${i.label}</button>`).join('')}</nav><small>切換上方分類，這裡會跟著改變。</small></details><div class="demo-page"><div class="local-location">3 · 操作內容　／　${label}　／　${child}</div>${!loaded.ok?`<p class="local-alert" role="alert">${esc(loaded.message)}</p>`:''}${message?`<p class="demo-toast" role="status">${esc(message)}</p>`:''}<div id="local-content"></div></div></div></div>`;
    const content=host.querySelector('#local-content');
    if(group==='buyer'){
      host.querySelector('#local-workspace').dataset.role='buyer';
      host.querySelector('.local-role').textContent='買家預覽';
      host.querySelector('.admin-context').innerHTML=btn('返回後台','nav','overview')+'<a class="row-action" href="startkiter-creator-platform-progress-uiux.html">總計畫</a>';
      const destinations=[['library','我的內容'],['catalog','可取得商品']];
      const links=destinations.map(([id,title])=>`<button type="button" data-local-action="submenu" data-id="${id}" ${sub===id?'aria-current="page"':''}>${title}</button>`).join('');
      host.querySelector('.demo-nav').innerHTML=links;
      host.querySelector('.local-sidebar summary').textContent='2 · 買家內容選單';
      host.querySelector('.local-sidebar nav').innerHTML=links;
      host.querySelector('.local-location').textContent='3 · 買家預覽 ／ '+(sub==='catalog'?'可取得商品':'我的內容');
    }
    // 三個view完整且經主控開關核准後才切換；途中保留以上原操作版。
    if(S&&window.CreatorLocalViewsEnabled){
      const context=viewContext();
      const result=S.render(window.CreatorLocalViews,context,()=>'<p class="local-alert" role="alert">新版畫面無法載入，資料未修改。<a href="?localAcceptance=1&legacy=1">回到原本操作版</a></p>');
      if(result.mode==='views'){content.innerHTML=result.html;if(page==='form')updateFields();}
      host.querySelector('#local-workspace').dataset.renderMode=result.mode;
    }else host.querySelector('#local-workspace').dataset.renderMode='legacy';
    if(page==='form')formBaseline=formSnapshot();
  }
  function viewContext(){return S.context({role:group==='buyer'?'buyer':role,group,sub,page,data,fixtures:{resources:M.resources,contacts,events,users:adminUsers,modules:adminModules},editing:editing?data.products.find(p=>p.id===editing):null,filters:{productKind,productStatus:filter,productSearch:term,contactConsent:contactFilter,contactSearch:contactTerm,liveKind:liveFilter,liveSearch:liveTerm,userRole,userSearch,detailId}});}
  function formSnapshot(){const f=host.querySelector('#local-form');if(!f)return '';return JSON.stringify([...f.elements].filter(i=>i.name).map(i=>[i.name,i.value,i.type==='checkbox'||i.type==='radio'?i.checked:null]));}
  function requestNavigation(action){if(page!=='form'||formSnapshot()===formBaseline){action();return;}pendingNavigation=action;const dialog=document.createElement('dialog');dialog.id='local-leave-dialog';dialog.setAttribute('aria-labelledby','local-leave-heading');dialog.innerHTML='<h3 id="local-leave-heading">這份商品還沒儲存</h3><p>留在這裡保留輸入，或放棄這次修改後切換畫面。</p><div class="local-actions">'+btn('留在這裡','stay')+btn('放棄修改並離開','discard')+'</div>';host.append(dialog);dialog.addEventListener('cancel',()=>{pendingNavigation=null;dialog.remove();});dialog.showModal();}
  function refreshViewSection(selector){if(!S||!window.CreatorLocalViewsEnabled)return false;const result=S.render(window.CreatorLocalViews,viewContext(),()=>host.querySelector('#local-content').innerHTML);if(result.mode!=='views')return false;const holder=document.createElement('div');holder.innerHTML=result.html;const source=holder.querySelector(selector),target=host.querySelector(selector);if(!source||!target)return false;target.innerHTML=source.innerHTML;return true;}
  function renderProducts(){refreshViewSection('#local-products');}
  function updateFields(){const f=host.querySelector('#local-form');if(!f)return;const type=f.elements.type.value;host.querySelector('#local-period').hidden=f.elements.billing.value!=='subscription';host.querySelector('#local-courses').hidden=['code','saas'].includes(type);host.querySelector('#local-service-label').hidden=type!=='saas';host.querySelector('#local-kit-label').hidden=type==='saas';}
  function go(next){page=next;if(['overview','products','contacts','live'].includes(next)){group=next;sub=N.items(role,group)[0]?.id||'';}if(next==='products')productKind='all';if(next==='form'){group='products';sub=productKind;}if(next==='buyer'){group='buyer';sub='library';}message='';render();host.querySelector('#local-heading')?.focus();window.scrollTo(0,0);}
  function selectSub(id){const check=S.resolve(group==='buyer'?'buyer':role,group,id,N);if(!check.ok){message=check.message;render();return;}sub=id;message='';if(group==='buyer')page='buyer';
    else if(role==='creator'&&group==='products'){productKind=id;page='products';}
    else if(role==='creator'&&group==='overview')page='overview';
    else if(role==='creator'&&group==='contacts'&&id==='contacts')page='contacts';
    else if(role==='creator'&&group==='live'&&['all','live','evergreen'].includes(id)){page='live';liveFilter=id;}
    else page='navigation-preview';render();host.querySelector('#local-heading')?.focus();}
  function renderContactRows(){refreshViewSection('#local-contacts');}
  function renderEventRows(){refreshViewSection('#local-events');}
  function unsupported(text){const field=host.querySelector('#local-form-error');if(field){field.hidden=false;field.textContent=text;return;}message=text;render();}
  function navigate(action,id){
    if(action==='nav'){
      if(id==='buyer'){go('buyer');return;}
      if(!N.groups(role).some(g=>g.id===id)){unsupported('這個後台入口不支援目前角色。');return;}
      if(['overview','products','contacts','live'].includes(id))go(id);else{group=id;selectSub(N.items(role,group)[0].id);}return;
    }
    if(action==='module'){
      const entries=N.items(role,id);if(!entries.length){unsupported('不支援這個主分類。');return;}group=id;selectSub(entries[0].id);return;
    }
    if(action==='submenu'){selectSub(id);return;}
    if(action==='role'){role=role==='creator'?'admin':'creator';group='overview';selectSub(N.items(role,group)[0].id);return;}
    if(role!=='creator'||group==='buyer'){unsupported('這個示範角色沒有商品編輯入口。');return;}
    if(action==='new'){editing=null;go('form');return;}
    if(action==='edit'){if(!data.products.some(p=>p.id===id)){unsupported('找不到要編輯的商品。');return;}editing=id;go('form');}
  }
  host.addEventListener('click',e=>{const b=e.target.closest('[data-local-action]');if(!b)return;const {localAction:a,id}=b.dataset;
    if(!S.supports(a)){unsupported('不支援這個操作；資料未修改。');return;}
    if(a==='stay'){pendingNavigation=null;host.querySelector('#local-leave-dialog')?.remove();host.querySelector('#local-name')?.focus();return;}
    if(a==='discard'){const next=pendingNavigation;pendingNavigation=null;host.querySelector('#local-leave-dialog')?.remove();next?.();return;}
    if(['nav','module','submenu','role','new','edit'].includes(a)){requestNavigation(()=>navigate(a,id));return;}
    if(a==='filter'){if(id?.startsWith('user-role:')){userRole=id.slice(10);if(!['all','creator','buyer'].includes(userRole)){userRole='all';unsupported('不支援這個角色篩選。');return;}}else filter=id;render();}
    if(a==='show-detail'){const [kind,target]=String(id).split(':');const list=kind==='user'?adminUsers:kind==='module'?adminModules:[];if(!list.some(v=>v.id===target)){unsupported('找不到這筆示範資料。');return;}detailReturn={page,group,sub};detailId=id;page='detail';render();host.querySelector('#local-heading')?.focus();}
    if(a==='back'){if(detailReturn){({page,group,sub}=detailReturn);detailReturn=null;detailId='';render();host.querySelector('#local-heading')?.focus();}else navigate('nav',group==='buyer'?'buyer':group);}
    if(a==='contact-filter'){contactFilter=id;render();}
    if(a==='live-filter'){liveFilter=id;render();}
    if(a==='acquire'){const r=M.acquire(store,id);if(r.ok){data=r.data;message='已模擬取得，內容已存本機；沒有付款或正式授權。';}else message=r.message;render();}
    if(a==='contact'){const c=contacts.find(c=>c.id===id);if(!c){unsupported('找不到這位示範聯絡人。');return;}detailReturn={page,group,sub};detailId='contact:'+id;page='detail';render();if(host.querySelector('#local-workspace').dataset.renderMode!=='views')host.querySelector('#local-content').innerHTML=header(c.name,'本機示範聯絡人，不寄送訊息。',btn('返回列表','back'))+`<p>來源：${esc(c.source)}</p><p>標籤：${esc(c.tag)}</p><p>行銷同意：${c.consent==='yes'?'已同意':'未同意，不可寄送'}</p><p>寄信與修改同意未串接。</p>`;host.querySelector('#local-heading')?.focus();}
    if(a==='event'){const v=events.find(v=>v.id===id);if(!v){unsupported('找不到這筆示範活動。');return;}detailReturn={page,group,sub};detailId='event:'+id;page='detail';render();if(host.querySelector('#local-workspace').dataset.renderMode!=='views')host.querySelector('#local-content').innerHTML=header(v.name,'本機示範活动，不開播。',btn('返回列表','back'))+`<p>類型：${v.kind==='live'?'即時直播':'預錄常青'}</p><p>時間：${esc(v.time)}</p><p>狀態：${esc(v.status)}</p><p>供應商尚未串接，不會播放影片或寄提醒。</p>`;host.querySelector('#local-heading')?.focus();}
    if(a==='resource'){if(!data.acquired.some(p=>id==='kit'?p.kit:id==='service'?p.service:p.courses.includes(id))){unsupported('尚未模擬取得這個內容。');return;}detailReturn={page,group,sub};detailId='resource:'+id;page='detail';render();if(host.querySelector('#local-workspace').dataset.renderMode!=='views'){const title=id==='kit'?'程式碼包交付':id==='service'?'SaaS 服務入口':M.resources.find(r=>r.id===id)?.name;host.querySelector('#local-content').innerHTML=header(title||'取得內容','本機示範入口，不連外部服務。',btn('返回我的內容','back'))+`<p>${id==='kit'?'正式流程將提供程式庫、操作手冊與 AI Skill；此處不下載真實程式。':id==='service'?'正式服務有自己的使用者與付費權限，與本平台課程分開；此處不登入任何服務。':'這是已取得課程的示範入口，未載入教材。'}</p>`;}host.querySelector('#local-heading')?.focus();}
  });
  host.addEventListener('input',e=>{if(e.target.id==='local-search'){term=e.target.value;renderProducts();}if(e.target.id==='local-contact-search'){contactTerm=e.target.value;renderContactRows();}if(e.target.id==='local-live-search'){liveTerm=e.target.value;renderEventRows();}if(e.target.id==='local-admin-search'){userSearch=e.target.value;refreshViewSection('#local-admin-users');}});
  host.addEventListener('change',e=>{if(!e.target.closest('#local-form'))return;const f=host.querySelector('#local-form');if(e.target.name==='type'){const type=f.elements.type.value;if(['code','saas'].includes(type))f.querySelectorAll('[name=courses]').forEach(i=>i.checked=false);f.elements.kit.checked=type==='code';f.elements.service.checked=type==='saas';}updateFields();});
  host.addEventListener('submit',e=>{if(e.target.id!=='local-form')return;e.preventDefault();const f=e.target;f.querySelectorAll('[aria-invalid]').forEach(i=>i.removeAttribute('aria-invalid'));const r=M.save(store,{id:editing||undefined,name:f.elements.name.value,type:f.elements.type.value,price:f.elements.price.value,billing:f.elements.billing.value,period:f.elements.period.value,status:f.elements.status.value,courses:[...f.querySelectorAll('[name=courses]:checked')].map(i=>i.value),kit:f.elements.kit.checked,service:f.elements.service.checked});if(!r.ok){const error=host.querySelector('#local-form-error');error.hidden=false;error.textContent=r.message;const field=r.field==='courses'?f.querySelector('[name=courses]'):f.querySelector(`[name="${r.field||'name'}"]`);field?.setAttribute('aria-invalid','true');field?.focus();return;}data=r.data;loaded={ok:true,data};editing=null;page='products';group='products';productKind='all';sub='all';message='已儲存到本機。重新整理後仍可編輯；沒有正式發布。';filter='all';term='';render();host.querySelector('#local-heading').focus();});
  render();window.scrollTo(0,0);
})();
