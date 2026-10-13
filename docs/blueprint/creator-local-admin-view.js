// 管理員本機示範：只讀快照並回傳 HTML，不連線或修改資料。
(function(root){
  function render(context){
    const {escape,button,heading}=context.helpers;
    const {group,sub,page}=context;
    const fixtures=context.fixtures||{},filters=context.filters||{};
    const users=fixtures.users||[],modules=fixtures.modules||[];
    const note='<p class="demo-note">本機示範，正式權限與資料未串接；不會保存設定、更新模組或修改使用者。</p>';
    const row=(label,value,display=value)=>`<div class="local-setting-row"><span>${escape(label)}</span><span${display!==value?` data-value="${escape(value)}"`:''}>${escape(display)}</span></div>`;
    const roleLabels=new Map([['admin','平台管理員'],['creator','創作者'],['buyer','買家']]);
    const statusLabels=new Map([['active','啟用中'],['inactive','未啟用'],['disabled','已停用']]);
    const panel=content=>`<div class="demo-panel">${content}</div>`;
    function record(item,kind){
      const fields=kind==='user'
        ?row('角色',item.role,roleLabels.get(item.role)??item.role)+row('狀態',item.status,statusLabels.get(item.status)??item.status)
        :row('版本',item.version)+row('狀態',item.status,statusLabels.get(item.status)??item.status);
      return `<article class="demo-record"><h4>${escape(item.name)}</h4>${row('示範識別碼',item.id)}${fields}</article>`;
    }
    if(context.role!=='admin')return heading('管理員預覽','此入口僅供平台管理員示範。')+note;
    if(page==='detail'){
      const detailId=String(filters.detailId||'');
      const kind=detailId.startsWith('user:')?'user':detailId.startsWith('module:')?'module':null;
      const item=kind?(kind==='user'?users:modules).find(item=>String(item.id)===detailId.slice(kind.length+1)):null;
      return heading(kind==='module'?'模組版本詳情':'使用者詳情','僅展示指定的本機示範資料。',button('返回','back'))+note+
        (item?record(item,kind):panel('<p>找不到指定的示範資料。</p>'))+
        (kind==='module'?'<p class="local-explainer">更新、相容性檢查與回滾未串接，不會執行版本變更。</p>':'');
    }
    if(group==='users'&&['all-users','roles'].includes(sub)){
      const userRole=filters.userRole||'all',term=String(filters.userSearch||'');
      const selected=users.filter(user=>(userRole==='all'||user.role===userRole)&&String(user.name??'').toLocaleLowerCase().includes(term.toLocaleLowerCase()));
      return heading(sub==='roles'?'角色與權限':'全部使用者','篩選與詳情只使用本機示範使用者。')+note+
        (sub==='roles'?panel('<p class="local-explainer">創作者管理自己的內容，買家查看已取得的內容。這裡僅示範角色資料，不會變更正式權限。</p>'):'')+
        `<div class="demo-toolbar"><input type="search" class="demo-search" id="local-admin-search" aria-label="搜尋示範使用者" placeholder="搜尋使用者名稱" value="${escape(term)}"><div class="demo-filter" aria-label="使用者角色">${[['all','全部'],['creator','創作者'],['buyer','買家']].map(([role,label])=>button(label,'filter',`user-role:${role}`,userRole===role?'row-action primary':'row-action')).join('')}</div></div>`+
        `<div class="local-records" id="local-admin-users">${selected.length?selected.map(user=>panel(record(user,'user')+button('查看使用者詳情','show-detail',`user:${user.id}`))).join(''):'<p>沒有符合條件的示範使用者。</p>'}</div>`;
    }
    if(group==='modules'&&['registry','updates'].includes(sub)){
      return heading(sub==='updates'?'更新與相容性':'已註冊模組','版本資料來自本機示範，未檢查正式部署。')+note+
        '<p class="local-explainer">更新、相容性檢查與回滾未串接；查看版本不會執行更新。</p>'+
        `<div class="local-records">${modules.length?modules.map(module=>panel(record(module,'module')+button('查看版本詳情','show-detail',`module:${module.id}`))).join(''):'<p>尚無模組資料（本機示範）。</p>'}</div>`;
    }
    if(group==='overview'){
      return heading('平台概況','僅統計傳入的本機示範資料，不代表正式平台營運數字。')+note+
        panel(row('示範使用者',users.length?`${users.length} 筆`:'尚無使用者資料')+row('示範模組',modules.length?`${modules.length} 筆`:'尚無模組資料')+row('正式平台狀態','本機未連線'));
    }
    if(group==='settings'){
      if(sub==='providers')return heading('服務連線狀態','此頁未讀取供應商設定，也未執行連線檢查。')+note+
        panel(['金流','寄信','直播','GitHub'].map(label=>row(label,'本機未連線')).join(''));
      if(sub==='audit')return heading('稽核紀錄','本機預覽未讀取正式操作紀錄。')+note+
        panel('<p>尚無稽核資料；正式紀錄未串接，不代表沒有操作或稽核已通過。</p>');
      if(sub==='platform-settings')return heading('平台基本設定','這裡說明平台設定的位置，不提供保存或憑證輸入。')+note+
        panel(row('目前位置','平台設定 ／ 平台基本設定')+row('設定來源','正式設定未串接')+row('連線狀態','本機未連線'));
    }
    return heading('管理員預覽','此入口尚無本機示範畫面。')+note+panel('<p>尚無資料。</p>');
  }
  const api={render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.CreatorLocalViews=root.CreatorLocalViews||{};root.CreatorLocalViews.admin=api;}
})(globalThis);
