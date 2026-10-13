const {test}=require('node:test');
const assert=require('node:assert/strict');
const N=require('./creator-local-navigation.js');
test('創作者主分類不把買家混為營運模組',()=>{assert.deepEqual(N.groups('creator').map(g=>g.id),['overview','contacts','site','email','automation','products','sales','live','settings']);});
test('商品子選單包含四種商品',()=>{assert.deepEqual(N.items('creator','products').map(i=>i.id),['all','course','bundle','code','saas']);});
test('設定取代商品子選單',()=>{assert.deepEqual(N.items('creator','settings').map(i=>i.id),['profile','account','payment','subscription','email','domains','integrations']);});
test('平台管理員和創作者有不同導航',()=>{assert.deepEqual(N.groups('admin').map(g=>g.id),['overview','users','modules','settings']);assert.deepEqual(N.items('admin','users').map(i=>i.id),['all-users','roles']);});
test('未知角色與分類不能產生導航',()=>{assert.deepEqual(N.groups('unknown'),[]);assert.deepEqual(N.items('creator','unknown'),[]);assert.deepEqual(N.items('unknown','products'),[]);});
