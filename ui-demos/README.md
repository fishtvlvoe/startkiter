# StartKiter UI Demo｜方向 A

方向 A 是「專業信任感」版本：用深靛藍、暖白與琥珀色，做出像顧問簽約與正式收據的買斷體驗。首頁用分段定價頁講清楚價值，登入頁像學員入口，dashboard 延續同一套收據、邊框與靛藍側欄語言。

## 頁面

- direction-a/index.html：前台首頁，包含產品說明、課程結構、信任背書與 NT$8,800 購買 CTA。
- direction-a/login.html：登入／註冊入口 mockup，包含 GitHub、LINE 與 Email 登入選項。
- direction-a/dashboard.html：登入後工作台，包含課程進度、付款狀態、AI 客服 Agent、GitHub 代碼包與 LINE 社群入口。

## 預覽

不需要安裝依賴或建置流程。直接用瀏覽器開啟：

~~~bash
open ui-demos/direction-a/index.html
~~~

若瀏覽器不允許直接預覽 file URL，可在 repo 根目錄執行：

~~~bash
python3 -m http.server 8765 --directory ui-demos
~~~

再開啟 <http://127.0.0.1:8765/direction-a/index.html>。

## 淺色／深色模式

每頁都用 CSS variables 定義 :root 淺色變數，並在 html.dark 覆寫深色變數。右上角按鈕用 vanilla JavaScript 切換 HTML 根元素的 dark class；目前主題會以 localStorage 記住，三頁共用同一個 key。

這是純靜態視覺 mockup，沒有接真實登入、付款、API 或部署。
