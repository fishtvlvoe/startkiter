// 創作者本機模板：只產生標記，保存、轉場與焦點由主控處理。
(function(root){
  const navigation=typeof module!=='undefined'&&module.exports?require('./creator-local-navigation.js'):root.CreatorLocalNavigation;
  const types=[['course','單堂課程'],['bundle','課程組合包'],['code','獨立程式碼包'],['saas','SaaS 服務']];
  const statuses=[['all','全部'],['draft','草稿'],['published','示範上架']];
  function render(context){
    const {escape:e,button,heading,price,resourceNames}=context.helpers;
    const {page,group,sub,filters:f,fixtures,products,editing}=context;
    const resources=fixtures.resources||[],contacts=fixtures.contacts||[],events=fixtures.events||[];
    const hidden=value=>value?' hidden':'';
    const checked=value=>value?' checked':'';
    const matches=(text,query)=>String(text??'').toLocaleLowerCase().includes(String(query??'').trim().toLocaleLowerCase());
    const empty=label=>`<p class="demo-empty">沒有符合條件的${label}。</p>`;
    const filters=(choices,action,selected)=>`<div class="demo-filter">${choices.map(([id,label])=>button(label,action,id).replace('<button ',`<button aria-pressed="${id===selected}" `)).join('')}</div>`;
    const search=(id,label,value)=>`<input type="search" class="demo-search" id="${id}" aria-label="${label}" placeholder="${label}" value="${e(value??'')}">`;
    const choices=(name,options,value)=>`<div class="local-choice">${options.map(([id,label])=>`<label class="demo-check"><input type="radio" name="${name}" value="${e(id)}"${checked(id===value)}>${e(label)}</label>`).join('')}</div>`;
    const note='<p class="demo-note">本機示範：付款、寄信、直播與正式交付未串接。</p>';
    if(page==='form'){
      const p=editing||{name:'',price:'',type:'course',billing:'once',period:'month',status:'draft',courses:[],kit:false,service:false};
      return heading(editing?'編輯商品':'新增商品','分開設定商品、收費與交付。',button('回商品列表','nav','products'))+
        `<form class="demo-form" id="local-form" novalidate>
          <label class="wide">商品名稱<input name="name" id="local-name" maxlength="100" value="${e(p.name)}" aria-describedby="local-form-error"></label>
          <fieldset class="wide"><legend>1. 賣什麼？</legend>${choices('type',types,p.type)}</fieldset>
          <fieldset class="wide"><legend>2. 怎麼收費？</legend>${choices('billing',[['once','一次購買'],['subscription','定期訂閱']],p.billing)}
            <div id="local-period"${hidden(p.billing!=='subscription')}><p>收款週期</p>${choices('period',[['month','每月'],['quarter','每季'],['year','每年']],p.period||'month')}</div>
          </fieldset>
          <label>價格（新台幣）<input name="price" id="local-price" inputmode="numeric" value="${e(p.price)}" placeholder="例如 1,200" aria-describedby="local-form-error"></label>
          <fieldset><legend>商品狀態</legend>${choices('status',statuses.slice(1),p.status)}</fieldset>
          <fieldset class="wide" id="local-delivery"><legend>3. 買家拿到什麼？</legend>
            <div id="local-courses"${hidden(['code','saas'].includes(p.type))}><p>單堂選一門，組合包選至少兩門。</p><div class="local-choice">${resources.map(r=>`<label class="demo-check"><input type="checkbox" name="courses" value="${e(r.id)}"${checked((p.courses||[]).includes(r.id))}>${e(r.name)}</label>`).join('')}</div></div>
            <label class="demo-check" id="local-kit-label"${hidden(p.type==='saas')}><input type="checkbox" name="kit"${checked(p.kit)}>私人程式碼包（示範，不連 GitHub）</label>
            <label class="demo-check" id="local-service-label"${hidden(p.type!=='saas')}><input type="checkbox" name="service"${checked(p.service)}>SaaS 服務入口（示範，不登入外部服務）</label>
          </fieldset>
          <p class="wide local-alert" id="local-form-error" role="alert" hidden></p>
          <div class="wide demo-form-actions">${button('取消','nav','products')}<button type="submit" class="admin-action primary" id="local-save">儲存到本機</button></div>
        </form>`+note;
    }
    if(page==='products'){
      const rows=products.filter(p=>(!f.productKind||f.productKind==='all'||p.type===f.productKind)&&(!f.productStatus||f.productStatus==='all'||p.status===f.productStatus)&&matches(p.name,f.productSearch));
      return heading('商品與銷售方案','課程、程式碼包與 SaaS 可獨立販售；下方列出各自交付。',button('新增商品','new','','admin-action primary'))+
        `<div class="demo-toolbar">${search('local-search','搜尋商品名稱',f.productSearch)}${filters(statuses,'filter',f.productStatus||'all')}</div><div id="local-products">${rows.length?`<div class="local-records">${rows.map(p=>`<article class="demo-record" data-product-id="${e(p.id)}"><h4>${e(p.name)}</h4><p>${e(types.find(([id])=>id===p.type)?.[1]||'未指定商品種類')} · ${e(p.status==='published'?'示範上架':'草稿')}</p><p>${e(price(p))}</p><ul>${resourceNames(p).map(name=>`<li>${e(name)}</li>`).join('')}</ul>${button('編輯商品','edit',p.id)}</article>`).join('')}</div>`:empty('商品')}</div>`+note;
    }
    if(page==='contacts'){
      const rows=contacts.filter(c=>(!f.contactConsent||f.contactConsent==='all'||c.consent===f.contactConsent)&&matches(`${c.name} ${c.tag}`,f.contactSearch));
      return heading('客戶名單','示範名單只驗收介面，不含真實個資；寄信與修改同意未串接。')+
        `<div class="demo-toolbar">${search('local-contact-search','搜尋客戶或標籤',f.contactSearch)}${filters([['all','全部'],['yes','已同意行銷'],['no','未同意行銷']],'contact-filter',f.contactConsent||'all')}</div><div id="local-contacts">${rows.length?`<div class="local-records">${rows.map(c=>`<article class="demo-record"><h4>${e(c.name)}</h4><p>${e(c.tag)} · ${c.consent==='yes'?'已同意行銷':'未同意行銷'}</p>${button('查看客戶','contact',c.id)}</article>`).join('')}</div>`:empty('示範客戶')}</div>`;
    }
    if(page==='live'){
      const rows=events.filter(v=>(!f.liveKind||f.liveKind==='all'||v.kind===f.liveKind)&&matches(v.name,f.liveSearch));
      return heading('直播與回放','即時直播與預錄常青分開；供應商未串接，不會實際開播或建立外部活動。')+
        `<div class="demo-toolbar">${search('local-live-search','搜尋活動名稱',f.liveSearch)}${filters([['all','全部'],['live','即時直播'],['evergreen','預錄常青']],'live-filter',f.liveKind||'all')}</div><div id="local-events">${rows.length?`<div class="local-records">${rows.map(v=>`<article class="demo-record"><h4>${e(v.name)}</h4><p>${v.kind==='live'?'即時直播':'預錄常青'} · ${e(v.status)}</p><p>${e(v.time)}</p>${button('查看活動','event',v.id)}</article>`).join('')}</div>`:empty('示範活動')}</div>`;
    }
    if(page==='detail'){
      const detailId=f.detailId||'';
      const contact=group==='contacts'&&detailId.startsWith('contact:')?contacts.find(c=>c.id===detailId.slice(8)):null;
      const event=group==='live'&&detailId.startsWith('event:')?events.find(v=>v.id===detailId.slice(6)):null;
      const body=contact?`<p>來源：${e(contact.source)}</p><p>標籤：${e(contact.tag)}</p><p>行銷同意：${contact.consent==='yes'?'已同意':'未同意，不可寄送'}</p><p>寄信與修改同意未串接。</p>`:
        event?`<p>類型：${event.kind==='live'?'即時直播':'預錄常青'}</p><p>時間：${e(event.time)}</p><p>狀態：${e(event.status)}</p><p>供應商未串接，不會播放影片或寄提醒。</p>`:empty('詳情資料');
      return heading(contact?.name||event?.name||'找不到示範詳情','本機示範詳情，外部服務未串接。',button('返回列表','back'))+`<div class="demo-panel">${body}</div>`;
    }
    if(page==='overview'){
      return heading('創作者工作台','本機商品與介面驗收，不代表正式營運資料。',button('新增商品','new','','admin-action primary'))+
        `<div class="demo-stats"><div class="demo-stat"><span>本機商品</span><strong>${products.length}</strong></div><div class="demo-stat"><span>示範上架</span><strong>${products.filter(p=>p.status==='published').length}</strong></div></div><div class="demo-panel"><h4>驗收路線</h4><p>建立商品、編輯收費與交付，再查看買家模擬取得內容。</p><div class="local-actions">${button('管理商品','nav','products')}${button('客戶名單','nav','contacts')}${button('直播活動','nav','live')}${button('預覽買家','nav','buyer')}</div></div>`+note;
    }
    const label=navigation?.groups('creator').find(g=>g.id===group)?.label||'創作者工作區';
    const child=navigation?.items('creator',group).find(i=>i.id===sub)?.label||'功能預覽';
    const descriptions={settings:'規劃帳戶、收款、寄信與網域設定。',site:'規劃網站頁面、銷售漏斗與名單表單。',email:'規劃信件內容、排程與寄送紀錄。',automation:'規劃觸發事件、條件與後續工作。',sales:'規劃訂單、訂閱、退款與優惠券。',contacts:'規劃標籤、分眾與行銷同意管理。',live:'規劃回放與活動紀錄。'};
    const description=descriptions[group]||'規劃此分類的管理內容。';
    const preview=heading(child,description)+`<p class="demo-note">介面提案：功能未串接，不會修改正式設定或資料。</p><div class="local-setting-row"><span>目前位置</span><strong>${e(label)} ／ ${e(child)}</strong></div>`;
    // 沿用舊 renderNavigationPreview 已核准的唯讀設定版型。
    if(group==='settings'&&sub==='profile')return preview+`<div class="demo-panel"><h4>創作者基本資料</h4><p class="local-explainer">這裡是設定的內容區；左邊可以切換收款、寄信或網域，上面的主分類保持不變。</p><div class="local-setting-grid"><label>顯示名稱<input readonly value="示範創作者"></label><label>品牌名稱<input readonly value="我的創作者工作室"></label><label>聯絡電子郵件<input readonly value="creator@example.test"></label><label>時區<input readonly value="Asia/Taipei"></label></div><p class="demo-note">目前供你驗收欄位位置，尚未提供設定保存。</p></div>`;
    if(group==='settings'&&sub==='payment')return preview+`<div class="demo-panel"><h4>收款服務</h4><div class="local-setting-row"><span>主金流</span><strong>PAYUNi（正式系統沿用）</strong></div><div class="local-setting-row"><span>連線狀態</span><span class="demo-status draft">本機未連線，不扣款</span></div><div class="local-setting-row"><span>商店代號</span><input readonly placeholder="正式後台設定，不讀取真實金鑰" aria-label="商店代號"></div><div class="local-setting-row"><span>金鑰與加密資訊</span><span>正式串接時使用安全設定，不在這份 Demo 顯示。</span></div></div>`;
    if(group==='contacts'&&sub==='tags'){
      const labels=[...new Set(contacts.map(c=>c.tag))];
      return preview+`<div class="local-records">${labels.length?labels.map(tag=>`<article class="demo-record"><h4>${e(tag)}</h4><p>示範聯絡人：${contacts.filter(c=>c.tag===tag).length} 位</p></article>`).join(''):empty('示範標籤')}</div>`;
    }
    if(group==='contacts'&&['segments','consent'].includes(sub))return preview+`<div class="demo-panel"><h4>同意狀態分開管理</h4>${contacts.length?['yes','no'].map(consent=>{
      const rows=contacts.filter(c=>c.consent===consent);
      return `<div class="local-setting-row"><span>${consent==='yes'?'已同意行銷':'尚未同意'}</span><span>${rows.map(c=>e(c.name)).join('、')||'尚無示範聯絡人'} · ${rows.length} 位${consent==='no'?'，不寄送行銷信':''}</span></div>`;
    }).join(''):empty('示範聯絡人')}</div>`;
    const columns={
      site:{pages:['頁面名稱','網址路徑','發布狀態'],funnels:['漏斗名稱','流程步驟','啟用狀態'],forms:['表單名稱','收集欄位','同意設定']},
      email:{campaigns:['活動名稱','收件分眾','排定時間','寄送狀態'],templates:['範本名稱','信件主旨','更新時間'],delivery:['信件主旨','收件對象','寄送時間','寄送結果']},
      automation:{rules:['規則名稱','觸發事件','判斷條件','後續工作'],workflows:['流程名稱','觸發入口','流程步驟','啟用狀態'],execution:['流程名稱','執行時間','執行步驟','執行結果']},
      sales:{orders:['訂單編號','商品','金額','付款狀態'],subscriptions:['訂閱商品','收費週期','下次收款','訂閱狀態'],refunds:['訂單編號','退款金額','申請時間','處理狀態'],coupons:['優惠碼','折扣方式','適用商品','有效期間']}
    };
    const fields=columns[group]?.[sub];
    if(fields)return preview+`<div class="demo-panel"><h4>${e(child)}列表提案</h4><p>以下是欄位與空狀態示意，未載入正式資料。</p><table><caption>${e(child)}（未串接）</caption><thead><tr>${fields.map(field=>`<th scope="col">${e(field)}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${fields.length}">${empty(`${child}資料`)}<p>資料來源未串接；不代表正式系統沒有紀錄。</p></td></tr></tbody></table></div>`;
    return preview+`<div class="demo-panel"><h4>${e(child)}的工作區</h4><p>${e(description)}</p><div class="local-setting-row"><span>畫面狀態</span><span>介面方向已列出，實際功能未串接。</span></div><div class="local-setting-row"><span>角色邊界</span><span>創作者：管理自己的內容與營運。</span></div><p>本輪只驗收版型與導航；保存設定、付款、寄信與開播仍待串接。</p></div>`;
  }
  const api={render};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {
    root.CreatorLocalViews=root.CreatorLocalViews||{};
    root.CreatorLocalViews.creator=api;
  }
})(globalThis);
