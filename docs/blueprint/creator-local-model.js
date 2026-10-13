// 本機驗收專用；不讀正式帳號、訂單或 provider。
(function (root) {
  const KEY = 'startkiter-local-acceptance-v1';
  const resources = [
    {id:'course-ai',name:'AI 自動化入門'},
    {id:'course-saas',name:'用 AI 建立會員服務'},
    {id:'course-product',name:'打造第一個線上產品'}
  ];
  const types = {course:'單堂課程',bundle:'課程組合包',code:'獨立程式碼包',saas:'SaaS 服務'};
  const periods = {month:'每月',quarter:'每季',year:'每年'};
  const copy = value => JSON.parse(JSON.stringify(value));
  const error = (message,field) => ({ok:false,message,field});
  function validate(input) {
    if (!input || typeof input !== 'object') return error('商品資料格式不正確。','name');
    const name = typeof input.name==='string' ? input.name.trim() : '';
    if (!name || name.length>100) return error('請填寫 1～100 字的商品名稱。','name');
    if (!Object.hasOwn(types,input.type)) return error('請選擇有效的商品類型。','type');
    const raw=String(input.price).trim(), price=Number(raw.replaceAll(',',''));
    if (!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(raw) || !Number.isSafeInteger(price) || price<1 || price>2147483647) return error('價格請填 1～2,147,483,647 的整數新台幣。','price');
    if (!['once','subscription'].includes(input.billing)) return error('請選擇付款方式。','billing');
    if (input.billing==='subscription' && !Object.hasOwn(periods,input.period)) return error('請選擇月、季或年週期。','period');
    if (!['draft','published'].includes(input.status)) return error('請選擇草稿或示範上架。','status');
    if (!Array.isArray(input.courses) || input.courses.some(id=>!resources.some(r=>r.id===id)) || new Set(input.courses).size!==input.courses.length) return error('請選擇有效且不重複的課程。','courses');
    if (input.type==='course' && input.courses.length!==1) return error('單堂課程請指定一門課。','courses');
    if (input.type==='bundle' && input.courses.length<2) return error('組合包請指定至少兩門課。','courses');
    if (['code','saas'].includes(input.type) && input.courses.length) return error('獨立程式包或 SaaS 不附帶課程；請清除課程選擇。','courses');
    if (typeof input.kit!=='boolean' || typeof input.service!=='boolean') return error('交付選擇格式不正確。','courses');
    if (input.type==='code' && !input.kit) return error('獨立程式包必須交付程式碼包。','kit');
    if (input.type==='saas' && !input.service) return error('SaaS 必須提供服務入口。','service');
    if (input.type!=='saas' && input.service) return error('服務入口僅適用 SaaS 商品。','service');
    return {ok:true,product:{id:input.id,name,type:input.type,price,billing:input.billing,period:input.billing==='once'?null:input.period,status:input.status,courses:[...input.courses],kit:input.kit,service:input.service}};
  }
  function seeds() {
    return {version:1,products:[
      {id:'seed-course',name:'AI 自動化入門',type:'course',price:8800,billing:'once',period:null,status:'published',courses:['course-ai'],kit:false,service:false},
      {id:'seed-bundle',name:'創作者工具組合包',type:'bundle',price:1200,billing:'subscription',period:'quarter',status:'published',courses:['course-ai','course-saas'],kit:false,service:false},
      {id:'seed-code',name:'持續更新的程式碼包',type:'code',price:600,billing:'subscription',period:'month',status:'published',courses:[],kit:true,service:false},
      {id:'seed-saas',name:'創作者會員工具',type:'saas',price:3600,billing:'subscription',period:'year',status:'published',courses:[],kit:false,service:true}
    ],acquired:[]};
  }
  function validRecords(records) {
    return Array.isArray(records) && records.every(p=>typeof p?.id==='string' && p.id.length>0 && p.id.length<=100 && validate(p).ok && p.period===(p.billing==='once'?null:p.period)) && new Set(records.map(p=>p.id)).size===records.length;
  }
  function load(storage) {
    try {
      const raw=storage.getItem(KEY);
      if(raw===null) return {ok:true,data:seeds()};
      const data=JSON.parse(raw);
      if(data?.version!==1 || !validRecords(data.products) || !validRecords(data.acquired)) return error('本機資料版本或格式不正確，已停止保存以免覆寫。請改用新的本機驗收資料空間。');
      return {ok:true,data};
    } catch {return error('無法讀取本機資料，已停止保存。請確認瀏覽器允許本機儲存。');}
  }
  function persist(storage,data) {
    try {storage.setItem(KEY,JSON.stringify(data));return {ok:true};}
    catch {return error('本機儲存不可用或空間不足；尚未保存，輸入已保留。');}
  }
  function save(storage,input) {
    const loaded=load(storage);if(!loaded.ok)return loaded;
    const checked=validate(input);if(!checked.ok)return checked;
    const data=copy(loaded.data), p=checked.product;
    if(p.id && !data.products.some(v=>v.id===p.id))return error('找不到要編輯的商品；未保存。');
    p.id=p.id||('local-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9));
    const index=data.products.findIndex(v=>v.id===p.id);
    if(index<0)data.products.push(p);else data.products[index]=p;
    const written=persist(storage,data);return written.ok?{ok:true,product:p,data}:written;
  }
  function acquire(storage,id) {
    const loaded=load(storage);if(!loaded.ok)return loaded;
    const data=copy(loaded.data), p=data.products.find(v=>v.id===id);
    if(!p || p.status!=='published')return error('只有示範上架商品可模擬取得。');
    if(!data.acquired.some(v=>v.id===id))data.acquired.push(copy(p));
    const written=persist(storage,data);return written.ok?{ok:true,data}:written;
  }
  const api = { KEY, resources, types, periods, validate, load, save, acquire };
  if (typeof module !== 'undefined') module.exports = api;
  else root.CreatorLocal = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
