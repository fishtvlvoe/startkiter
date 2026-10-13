const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const S=require('./creator-local-shell.js');
const A=require('./creator-local-admin-view.js');

function state(overrides={}){
  return {
    role:'admin',group:'users',sub:'all-users',page:'navigation-preview',
    data:{products:[],acquired:[]},
    filters:{userRole:'all',userSearch:'',detailId:''},
    fixtures:{
      users:[
        {id:'user-creator',name:'Demo Creator',role:'creator',status:'active'},
        {id:'user-buyer',name:'Demo Buyer',role:'buyer',status:'active'}
      ],
      modules:[{id:'course',name:'課程模組',version:'demo-1',status:'示範'}]
    },
    ...overrides
  };
}
function context(overrides={}){return S.context(state(overrides));}
function html(overrides={}){
  const result=A.render(context(overrides));
  assert.equal(typeof result,'string');
  return result;
}
function buttons(result){return result.match(/<button\b[^>]*>[\s\S]*?<\/button>/gi)||[];}
function action(result,name,id){
  assert.ok(buttons(result).some(b=>b.includes(`data-local-action="${name}"`)&&(!id||b.includes(`data-id="${S.escape(id)}"`))),`缺少本機命令 ${name} ${id||''}`);
}
function empty(result){assert.match(result,/無使用者|沒有使用者|尚無使用者|查無|沒有符合|找不到|無模組|沒有模組|尚無模組|空資料|沒有資料|尚無資料/);}
function escaped(result,values){
  for(const value of values){assert.ok(result.includes(S.escape(value)),`應顯示轉義值：${value}`);assert.ok(!result.includes(value),`不應插入原始 markup：${value}`);}
  assert.doesNotMatch(result,/<(?:script|img|svg)\b/i);
  assert.doesNotMatch(result,/<[^>]+\s on\w+\s*=/i);
}

test('UMD 可 require 且只匯出 render',()=>{
  assert.deepEqual(Object.keys(A),['render']);
  assert.equal(typeof A.render,'function');
});
test('瀏覽器註冊 admin 並保留既有 creator 與 buyer',()=>{
  const creator={render:()=> 'creator'},buyer={render:()=> 'buyer'};
  const namespace={creator,buyer};
  const sandbox={CreatorLocalViews:namespace};sandbox.window=sandbox;
  vm.runInNewContext(fs.readFileSync(require.resolve('./creator-local-admin-view.js'),'utf8'),sandbox);
  assert.equal(sandbox.CreatorLocalViews,namespace);
  assert.equal(namespace.creator,creator);assert.equal(namespace.buyer,buyer);
  assert.equal(typeof namespace.admin.render,'function');
});
test('全部使用者顯示兩筆 fixture、搜尋與列表掛載點',()=>{
  const result=html();
  assert.match(result,/Demo Creator/);assert.match(result,/Demo Buyer/);
  assert.match(result,/id="local-admin-search"/);assert.match(result,/id="local-admin-users"/);
  for(const role of ['all','creator','buyer'])action(result,'filter',`user-role:${role}`);
  action(result,'show-detail','user:user-creator');action(result,'show-detail','user:user-buyer');
});
for(const sub of ['all-users','roles']){
  test(`${sub}：creator 篩選只展示 Demo Creator`,()=>{
    const result=html({sub,filters:{userRole:'creator',userSearch:'',detailId:''}});
    assert.match(result,/Demo Creator/);assert.doesNotMatch(result,/Demo Buyer/);
    action(result,'filter','user-role:creator');
    action(result,'show-detail','user:user-creator');
    assert.ok(!buttons(result).some(b=>b.includes('data-id="user:user-buyer"')));
  });
}
test('buyer 篩選只展示 Demo Buyer',()=>{
  const result=html({filters:{userRole:'buyer',userSearch:'',detailId:''}});
  assert.match(result,/Demo Buyer/);assert.doesNotMatch(result,/Demo Creator/);
});
test('搜尋使用者並與角色條件共同生效',()=>{
  const result=html({filters:{userRole:'all',userSearch:'Buyer',detailId:''}});
  assert.match(result,/Demo Buyer/);assert.doesNotMatch(result,/Demo Creator/);
  empty(html({filters:{userRole:'creator',userSearch:'Buyer',detailId:''}}));
});
test('使用者詳情展示指定 fixture 並提供 back',()=>{
  const result=html({page:'detail',filters:{userRole:'creator',userSearch:'',detailId:'user:user-creator'}});
  for(const value of ['Demo Creator','user-creator','creator','active'])assert.ok(result.includes(value),`詳情缺少 ${value}`);
  assert.doesNotMatch(result,/Demo Buyer/);action(result,'back');
  assert.match(result,/未串接/);
});
for(const sub of ['registry','updates']){
  test(`${sub}：模組 fixture 展示版本且不提供更新命令`,()=>{
    const result=html({group:'modules',sub});
    assert.match(result,/課程模組/);assert.match(result,/demo-1/);assert.match(result,/未串接/);
    action(result,'show-detail','module:course');
    for(const b of buttons(result))assert.match(b,/data-local-action="(?:show-detail|back)"/);
  });
}
test('模組版本詳情保留 demo-1、狀態與返回，不執行更新',()=>{
  const result=html({group:'modules',sub:'updates',page:'detail',filters:{detailId:'module:course'}});
  for(const value of ['course','課程模組','demo-1','示範'])assert.ok(result.includes(value),`模組詳情缺少 ${value}`);
  assert.match(result,/未串接/);action(result,'back');
  for(const b of buttons(result))assert.match(b,/data-local-action="back"/);
});
test('空或缺少 fixtures 提供明確空狀態且不虛構記錄',()=>{
  for(const fixtures of [{users:[],modules:[]},{}]){
    for(const route of [{group:'users',sub:'all-users'},{group:'modules',sub:'registry'}]){
      const result=html({...route,fixtures});empty(result);
      assert.doesNotMatch(result,/Demo Creator|Demo Buyer|demo-1/);
      assert.ok(!buttons(result).some(b=>b.includes('data-local-action="show-detail"')));
    }
  }
});
test('找不到使用者或模組詳情時呈現空狀態並保留返回',()=>{
  for(const detailId of ['user:missing','module:missing']){
    const result=html({group:detailId.startsWith('module:')?'modules':'users',page:'detail',filters:{detailId}});
    empty(result);action(result,'back');
    assert.doesNotMatch(result,/Demo Creator|Demo Buyer|demo-1/);
  }
});
test('使用者名稱、ID、角色及狀態在列表與詳情全部轉義',()=>{
  const user={id:'u" data-danger="<id>',name:'<img src=x onerror="boom">',role:'<角色&\'>',status:'<狀態&">'};
  const fixtures={users:[user],modules:[]};
  for(const page of ['navigation-preview','detail']){
    const result=html({page,fixtures,filters:{userRole:'all',userSearch:'',detailId:`user:${user.id}`}});
    escaped(result,Object.values(user));
    if(page==='navigation-preview')action(result,'show-detail',`user:${user.id}`);
  }
});
test('搜尋值在 input 屬性中轉義',()=>{
  const term='" autofocus onfocus="boom<>&\'';
  const result=html({filters:{userRole:'all',userSearch:term,detailId:''}});
  assert.match(result,/id="local-admin-search"/);
  assert.ok(result.includes(`value="${S.escape(term)}"`));
  assert.doesNotMatch(result,/<[^>]+\s on\w+\s*=/i);
});
test('模組名稱、ID、版本與狀態在列表及詳情全部轉義',()=>{
  const module={id:'m" data-danger="<id>',name:'<svg onload="boom">',version:'<版本&\'>',status:'<狀態&">'};
  const fixtures={users:[],modules:[module]};
  for(const page of ['navigation-preview','detail']){
    const result=html({group:'modules',sub:'registry',page,fixtures,filters:{detailId:`module:${module.id}`}});
    escaped(result,Object.values(module));
    if(page==='navigation-preview')action(result,'show-detail',`module:${module.id}`);
  }
});
test('所有管理員入口有未串接標示、結構與本機命令，無內嵌事件',()=>{
  for(const route of [{group:'users',sub:'all-users'},{group:'users',sub:'roles'},{group:'modules',sub:'registry'},{group:'modules',sub:'updates'}]){
    const result=html(route);assert.match(result,/未串接/);assert.match(result,/id="local-heading"/);
    assert.doesNotMatch(result,/<[^>]+\s on\w+\s*=/i);
    for(const b of buttons(result))assert.match(b,/data-local-action="(?:filter|show-detail|back)"/);
    assert.doesNotMatch(result,/<form\b|<script\b/i);
  }
});
test('render 使用凍結快照且不修改輸入、fixtures 或保存資料',()=>{
  const input=state();const before=JSON.stringify(input);const ctx=S.context(input);
  assert.ok(Object.isFrozen(ctx));assert.ok(Object.isFrozen(ctx.filters));
  assert.ok(Object.isFrozen(ctx.fixtures.users[0]));assert.ok(Object.isFrozen(ctx.fixtures.modules[0]));
  const snapshot=JSON.stringify(ctx);
  assert.doesNotThrow(()=>A.render(ctx));
  assert.equal(JSON.stringify(ctx),snapshot);assert.equal(JSON.stringify(input),before);
  const source=fs.readFileSync(require.resolve('./creator-local-admin-view.js'),'utf8');
  const sandbox={};sandbox.window=sandbox;
  for(const key of ['localStorage','sessionStorage','document','location','fetch'])Object.defineProperty(sandbox,key,{get(){throw new Error(`不允許存取 ${key}`);}});
  vm.runInNewContext(source,sandbox);
  assert.doesNotThrow(()=>sandbox.CreatorLocalViews.admin.render(ctx));
});
