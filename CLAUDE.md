# PixelChatRoom

小型網頁多人像素聊天遊戲，最多 5 人同時在線。完整設計規格、訊息協定、模組驗收標準見 `PixelChatRoom_spec.md`（本檔不重複那些內容，有疑問先看那份）。

## 技術棧
- 前端：純 HTML5 Canvas + Vanilla JS，不用任何 game framework
- 後端：Node.js + `ws` library，狀態存在記憶體，無資料庫
- 通訊：WebSocket，訊息格式 JSON
- Node 版本：本機開發用 v26.5.0。Module A 建立 `package.json` 時請加上 `"engines": {"node": ">=22"}`，用機制鎖定而不是只靠這行文字提醒

## 開發規則
- 開始任何一個 Module 前先進 Plan Mode，等我確認計畫再動手，不要直接跳進去寫 code
- 依 `PixelChatRoom_spec.md` 的 Module 順序開發，一次一個，不要跳著做或多個一起做
- 每個 Module 完成後，依該 Module 的驗收標準親自跑過驗證（不是自己判斷完成），驗證通過才進下一個，並做一次語意清楚的 git commit
- 規格內容不清楚、或發現前後矛盾時，先停下來問我，不要自行假設後繼續做
- 目前在 `/sandbox` 模式下執行，檔案異動限於本專案目錄內

## 怎麼驗證
- 後端：`node server.js` 手動啟動，觀察 console 有無錯誤訊息
- 多人情境：開多個瀏覽器分頁模擬不同玩家連線
- 目前沒有自動化測試框架，驗證都是手動跑過一次確認行為符合 spec.md 的驗收標準
