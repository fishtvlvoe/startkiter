const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('./creator-local-model.js');
const storage = () => { const entries = new Map(); return { getItem: k => entries.get(k) ?? null, setItem: (k,v) => entries.set(k,v) }; };
const product = (type='bundle') => ({name:'Creator Bundle',type,price:'1,200',billing:'subscription',period:'quarter',status:'published',courses:type==='course'?['course-ai']:type==='bundle'?['course-ai','course-saas']:[],kit:type==='code',service:type==='saas'});
test('季度組合包保存與重讀一致', () => {
  const s=storage(), r=M.save(s,product()); assert.equal(r.ok,true);
  const p=M.load(s).data.products.find(p=>p.id===r.product.id);
  assert.equal(p.name,'Creator Bundle');assert.equal(p.price,1200);assert.equal(p.period,'quarter');assert.deepEqual(p.courses,['course-ai','course-saas']);
});
for (const type of ['course','bundle','code','saas']) for(const period of ['once','month','quarter','year']) test(`${type} / ${period}`,()=>{
  const p=product(type);p.billing=period==='once'?'once':'subscription';p.period=period==='once'?'month':period;
  const r=M.save(storage(),p); assert.equal(r.ok,true);assert.equal(r.product.period,period==='once'?null:period);
});
test('單堂不得選兩門，錯誤不寫入',()=>{const s=storage();s.setItem('other','keep');const p=product('course');p.courses.push('course-saas');const r=M.save(s,p);assert.equal(r.ok,false);assert.equal(r.field,'courses');assert.equal(s.getItem(M.KEY),null);assert.equal(s.getItem('other'),'keep');});
test('不合法價格與名稱保留存檔',()=>{const s=storage();const r=M.save(s,product());const before=s.getItem(M.KEY);for(const price of ['0','-1','1.2','1,20','2147483648']) assert.equal(M.save(s,{...product(),price}).ok,false);assert.equal(M.save(s,{...product(),name:' '}).ok,false);assert.equal(s.getItem(M.KEY),before);assert.ok(r.ok);});
test('損壞與新版本資料不覆寫',()=>{for(const raw of ['bad',JSON.stringify({version:2}),JSON.stringify({version:1,products:[],acquired:[{}]})]){const s=storage();s.setItem(M.KEY,raw);assert.equal(M.save(s,product()).ok,false);assert.equal(s.getItem(M.KEY),raw);}});
test('storage 拒絕寫入不得成功',()=>{const s={getItem:()=>null,setItem:()=>{throw Error('denied');}};assert.equal(M.save(s,product()).ok,false);});
test('空買家、指定快照、不重複、後改不污染',()=>{const s=storage();assert.deepEqual(M.load(s).data.acquired,[]);const r=M.save(s,product());assert.equal(M.acquire(s,r.product.id).ok,true);assert.equal(M.acquire(s,r.product.id).ok,true);assert.equal(M.load(s).data.acquired.length,1);M.save(s,{...product(),id:r.product.id,courses:['course-ai','course-product']});assert.deepEqual(M.load(s).data.acquired[0].courses,['course-ai','course-saas']);});
test('草稿不得取得，程式包無課程，SaaS 獨立入口',()=>{const s=storage();const p=M.save(s,{...product('code'),status:'draft'});assert.equal(M.acquire(s,p.product.id).ok,false);const c=M.save(s,product('code'));M.acquire(s,c.product.id);const a=M.load(s).data.acquired[0];assert.deepEqual(a.courses,[]);assert.equal(a.kit,true);assert.equal(a.service,false);const v=M.save(s,product('saas'));M.acquire(s,v.product.id);assert.equal(M.load(s).data.acquired[1].service,true);});
test('未知類別／週期／資源與不存在編輯均拒絕',()=>{for(const change of [{type:'unknown'},{period:'week'},{billing:'free'},{courses:['unknown','course-ai']},{id:'missing'},{status:'fake'}])assert.equal(M.save(storage(),{...product(),...change}).ok,false);});
test('注入內容只當字串存，不改原型',()=>{const s=storage();const name='<img src=x onerror=alert(1)>';const r=M.save(s,{...product(),name});assert.equal(r.product.name,name);assert.equal({}.polluted,undefined);});
