// 本機畫面導航映射；不是正式角色或權限檢查。
(function(root){
  const map={
    creator:[
      ['overview','工作台',[['home','營運概況']]],
      ['contacts','客戶關係管理',[['contacts','聯絡人'],['tags','標籤'],['segments','分眾'],['consent','同意與退訂']]],
      ['site','站點',[['pages','網站頁面'],['funnels','銷售漏斗'],['forms','表單']]],
      ['email','電子郵件',[['campaigns','行銷活動'],['templates','信件範本'],['delivery','寄送紀錄']]],
      ['automation','自動化',[['rules','自動化規則'],['workflows','工作流程'],['execution','執行紀錄']]],
      ['products','產品',[['all','全部商品'],['course','單堂課程'],['bundle','課程組合包'],['code','獨立程式碼包'],['saas','SaaS 服務']]],
      ['sales','銷售',[['orders','訂單'],['subscriptions','訂閱'],['refunds','退款'],['coupons','優惠券']]],
      ['live','直播與回放',[['all','全部活動'],['live','即時直播'],['evergreen','預錄常青'],['replays','回放']]],
      ['settings','設定',[['profile','基本資料'],['account','帳戶與權限'],['payment','收款設定'],['subscription','我的方案'],['email','寄信設定'],['domains','自訂網域'],['integrations','整合與金鑰']]]
    ],
    admin:[
      ['overview','平台概況',[['platform-home','營運總覽']]],
      ['users','使用者與角色',[['all-users','全部使用者'],['roles','角色與權限']]],
      ['modules','模組與版本',[['registry','已註冊模組'],['updates','更新與相容性']]],
      ['settings','平台設定',[['platform-settings','平台基本設定'],['providers','服務連線狀態'],['audit','稽核紀錄']]]
    ]
  };
  function groups(role){return (map[role]||[]).map(([id,label])=>({id,label}));}
  function items(role,group){return ((map[role]||[]).find(g=>g[0]===group)?.[2]||[]).map(([id,label])=>({id,label}));}
  const api={groups,items};
  if(typeof module!=='undefined')module.exports=api;else root.CreatorLocalNavigation=api;
})(globalThis);
