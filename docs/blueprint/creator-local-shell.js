// 三角色本機殼的共用契約，不是正式授權。
(function(root){
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function button(label,action,id='',cls='row-action'){return `<button type="button" class="${escape(cls)}" data-local-action="${escape(action)}"${id?` data-id="${escape(id)}"`:''}>${escape(label)}</button>`;}
  function heading(title,description,action=''){return `<div class="demo-page-head"><div><h3 tabindex="-1" id="local-heading">${escape(title)}</h3><p>${escape(description)}</p></div>${action}</div>`;}
  function price(p){return `NT$ ${p.price.toLocaleString('zh-TW')} · ${p.billing==='once'?'一次購買':({month:'每月',quarter:'每季',year:'每年'}[p.period]||'週期待確認')}`;}
  function freeze(v){if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
  function context(state){
    const copy=v=>JSON.parse(JSON.stringify(v));
    const fixtures=copy(state.fixtures||{});
    const helpers={escape,button,heading,price,resourceNames:p=>[...(p.courses||[]).map(id=>(fixtures.resources||[]).find(r=>r.id===id)?.name||'未指定課程'),...(p.kit?['私人程式碼包（示範）']:[]),...(p.service?['SaaS 服務入口（示範）']:[])]};
    return freeze({role:state.role,group:state.group,sub:state.sub,page:state.page,products:copy(state.data?.products||[]),acquired:copy(state.data?.acquired||[]),fixtures,editing:copy(state.editing||null),filters:copy(state.filters||{}),helpers});
  }
  function resolve(role,group,sub,nav){
    if(role==='buyer')return group==='buyer'&&['library','catalog'].includes(sub)?{ok:true,role,group,sub}:{ok:false,message:'不支援這個買家入口。'};
    if(!['admin','creator'].includes(role)||!nav.groups(role).some(g=>g.id===group)||!nav.items(role,group).some(i=>i.id===sub))return {ok:false,message:'不支援這個角色或功能入口。'};
    return {ok:true,role,group,sub};
  }
  function render(views,ctx,legacy){
    const fallback=reason=>({mode:'legacy',html:legacy(),reason});
    if(!['admin','creator','buyer'].every(r=>typeof views?.[r]?.render==='function'))return fallback('三種角色畫面尚未完整，保留原本操作版。');
    if(!['admin','creator','buyer'].includes(ctx.role))return fallback('角色無效，未切換新版畫面。');
    try {const html=views[ctx.role].render(ctx);if(typeof html!=='string'||!html.trim())return fallback('角色畫面無法顯示，保留原本操作版。');return {mode:'views',html};}
    catch{return fallback('角色畫面發生錯誤，保留原本操作版。');}
  }
  const actions=new Set(['nav','module','submenu','new','edit','filter','contact-filter','live-filter','acquire','resource','contact','event','show-detail','back','role','stay','discard']);
  const supports=action=>actions.has(action);
  const api={escape,button,heading,price,context,resolve,render,supports};
  if(typeof module!=='undefined')module.exports=api;else root.CreatorLocalShell=api;
})(globalThis);
