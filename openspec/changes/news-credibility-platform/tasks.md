## 1. 專案骨架與基礎設施

- [ ] 1.1 建立 Next.js（App Router, TypeScript）專案，設定 ESLint/Prettier
- [ ] 1.2 加入 Tailwind CSS + shadcn/ui，建立基礎版型與主題
- [ ] 1.3 設定 `next-intl` 中／英雙語與語言切換骨架
- [ ] 1.4 建立本地 PostgreSQL、設定 `DATABASE_URL`（`.env.local`；prod 再換 Neon/Vercel）
- [ ] 1.5 加入 Prisma（client 生成至 `lib/generated/prisma`）與 migration 流程
- [ ] 1.6 加入 `@anthropic-ai/sdk` 並封裝呼叫層（含 retry、token/成本記錄 hook）

## 2. 資料模型（Prisma schema + migration）

- [ ] 2.1 定義 `sources`、`articles` 表
- [ ] 2.2 定義 `events`、`event_timeline`、`event_sources` 表
- [ ] 2.3 定義 `rubric_versions`、`appeals`、`ai_runs` 表
- [ ] 2.4 撰寫並執行首次 migration，確認 schema 建立成功
- [ ] 2.5 建立 seed：初始來源白名單與第一版 rubric

## 3. 擷取（news-ingestion）

- [ ] 3.1 實作來源註冊表讀取與啟用/停用邏輯
- [ ] 3.2 實作 RSS 抓取器（解析 feed、抽標題/連結/時間/片段）
- [ ] 3.3 實作 URL 正規化與擷取去重（canonical_url 唯一）
- [ ] 3.4 實作單來源失敗隔離與錯誤記錄
- [ ] 3.5（可選）實作 News API 介接，與 RSS 共用入庫流程
- [ ] 3.6 驗證：執行一次擷取，確認 articles 正確入庫且不重複、不存全文於對外欄位

## 4. 分群與 triage（event-clustering）

- [ ] 4.1 設計分群 prompt 與輸出 schema（structured output）
- [ ] 4.2 實作 Haiku 分群：將 new 文章歸入既有或新 event（含跨語系）
- [ ] 4.3 實作近似重複偵測與折疊
- [ ] 4.4 實作重要性評分與門檻，達標者標記 `pending_research`
- [ ] 4.5 接上 Batch API 批次分群與 Prompt Caching（共用分群指示）
- [ ] 4.6 驗證：一批文章分群正確、低重要性叢集不升級、重要事件升級

## 5. 事件研究（event-research）

- [ ] 5.1 設計研究 agent：system prompt、web_search/web_fetch 工具、task budget
- [ ] 5.2 實作 agentic loop（tool runner），蒐集候選來源與引用
- [ ] 5.3 產出來龍去脈敘事（中／英），關鍵主張對應來源
- [ ] 5.4 抽取並排序時間序列，標註來源與衝突說法並陳
- [ ] 5.5 實作事件更新（既有事件追加進展而非重建）
- [ ] 5.6 驗證：以「伊朗—美國和談」類議題實測，檢查時序、敘事、引用完整

## 6. 可信度評分（credibility-scoring）

- [ ] 6.1 撰寫第一版評分 rubric 並寫入 `rubric_versions`
- [ ] 6.2 實作來源/主張評分（分級 + 理由 + 依據），對事不對人
- [ ] 6.3 實作官方/權威來源辨識與來源排名
- [ ] 6.4 實作事件整體可靠度推導（verified/developing/disputed/unverified）
- [ ] 6.5 每筆評分記錄 rubric 版本，Prompt Caching 共用 rubric 前綴
- [ ] 6.6 驗證：評分理由具體可溯源、官方來源置頂、整體可靠度合理

## 7. 管線編排（Cron + 佇列）

- [ ] 7.1 建立各階段為冪等的 serverless function（以 status 控制）
- [ ] 7.2 設定 Vercel Cron 觸發 ingest / cluster / research-dispatcher
- [ ] 7.3 接上 Upstash QStash 做每事件研究的卸載與重試
- [ ] 7.4 提高研究 function `maxDuration`（Fluid Compute），設逾時保護
- [ ] 7.5 驗證：端到端跑一輪，confirm 文章→事件→研究→評分自動完成

## 8. 讀者前端（event-feed-ui）

- [ ] 8.1 首頁重點事件 feed：卡片 + 標題後方可信度標記（雙語）
- [ ] 8.2 可信度標記點擊展開整體可靠度說明
- [ ] 8.3 事件詳情頁：來龍去脈敘事 + 時間序列
- [ ] 8.4 詳情頁來源清單：依可信度排名、官方來源突顯、連回原文
- [ ] 8.5 評分理由展開檢視
- [ ] 8.6 語言切換與語系偏好記憶；響應式（桌機/行動）
- [ ] 8.7 驗證：feed 與詳情頁雙語、行動裝置正常、來源皆可外連

## 9. 合規（content-compliance）

- [ ] 9.1 確保對外 API/頁面僅回傳標題+摘要+連結，不暴露全文
- [ ] 9.2 全來源歸屬與原文連結；敘事/時序主張可溯源
- [ ] 9.3 評分處顯示「依公開方法論之評估意見」聲明 + 方法論頁
- [ ] 9.4 申訴/更正：提交表單、`appeals` 記錄、爭議評分標記待覆核
- [ ] 9.5 原始全文保存期限 job：過期清除暫存全文，保留 metadata/摘要
- [ ] 9.6 來源排除：robots.txt/opt-out/撤下請求處理流程

## 10. 觀測、成本與部署

- [ ] 10.1 `ai_runs` 記錄每次呼叫 token/搜尋/成本，建簡易成本儀表
- [ ] 10.2 設成本/失敗告警門檻
- [ ] 10.3 設定 Vercel 環境變數、Cron、QStash 正式環境
- [ ] 10.4 端到端煙霧測試與上線前法律覆核檢查清單
- [ ] 10.5 部署至 Vercel 並驗證生產環境管線運作

## 11. 核心議題與地區（v2）

- [ ] 11.1 Prisma 加入 `Topic` 表、`Event.topicId`、`Event.regions`、Region 對照
- [ ] 11.2 事件研究階段標註事件地區（國家→宏觀區域對照）
- [ ] 11.3 將事件提煉/掛入核心議題（建立 topic、串接事件）
- [ ] 11.4 議題三維度分類（領域/時間區間/地區）與整體狀態彙整
- [ ] 11.5 議題隨新事件更新（不重複建立）

## 12. 真實地圖與三層前端（v2）

- [ ] 12.1 焦點總覽頁：核心議題卡片 + `領域×時間區間×地區` 篩選
- [ ] 12.2 真實世界地圖元件（d3-geo + TopoJSON world-atlas），hover 議題高亮相關地區
- [ ] 12.3 核心議題頁：旗下事件時間軸（由核心向外擴散）
- [ ] 12.4 事件檔案頁串接（沿用既有設計）
- [ ] 12.5 三層導覽與雙語（en / zh-Hant）
