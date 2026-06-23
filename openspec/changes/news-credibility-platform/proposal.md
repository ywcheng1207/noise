## Why

讀者每天面對大量零碎、立場分歧、真假難辨的新聞，難以快速掌握「一個重點事件的完整來龍去脈」與「哪個來源最可信」。例如「伊朗—美國和談」這類議題，各家說法不一、時序混亂，讀者無從判斷。

本平台不只是聚合新聞，而是**以「事件」為單位**幫讀者把資訊整理清楚：自動偵測重點時事 → 用 AI 跨來源（不限語系）研究 → 排出時間序列、講清來龍去脈、並依可信度排名來源（標示官方/最高可信來源）。目標是把「篩選與查證」這件高認知成本的事自動化。

## What Changes

- 新增一條 **資料管線（pipeline）**：定時輪詢主要新聞網站/RSS，偵測「正在發生什麼」的種子文章（不重製全文，只存標題、metadata、原文連結）。
- 新增 **事件分群**：把零碎的種子文章去重、分群成獨立的「事件/議題」，避免資訊零碎。
- 新增 **AI agentic 研究層**：對每個事件用 `web_search` + `web_fetch` 跨來源延伸研究，產出「來龍去脈」敘事與**時間序列**。
- 新增 **可信度評分**：對事件內各來源/各主張評分，找出官方或最高可信來源；方法論透明、對單篇/單一主張而非媒體人格、提供申訴/更正機制。
- 新增 **雙語（中／英）讀者前端**：以「重點事件卡片」呈現 feed（標題後方有可信度標記），點進去是完整事件檔案（時序、來龍去脈、可信來源排名）。
- 新增 **合規保護**：僅儲存與呈現標題＋自製摘要＋原文連結，全文僅後端暫存供分析、不對外重製；提供來源歸屬與申訴管道。
- 全端以 **Next.js** 實作，部署於 **Vercel**（含 API routes / serverless functions、Vercel Cron、Postgres 資料庫）。AI 使用 Anthropic Claude（Haiku 4.5 做分群/triage、Sonnet 4.6 做研究與評分、最難推理可選 Opus 4.8），搭配 Prompt Caching 與 Batch API 控制成本。

> 本變更為全新專案（greenfield），無既有能力被破壞。

## Capabilities

### New Capabilities
- `news-ingestion`：定時從主要新聞來源（RSS/News API/輕量爬蟲）擷取種子文章的標題與 metadata，遵守 robots.txt 與來源 ToS，不重製全文。
- `event-clustering`：將種子文章去重並分群為獨立「事件/議題」，判定哪些值得進入研究階段（重點時事優先）。
- `event-research`：對每個事件執行 agentic 跨來源研究（web_search + web_fetch + 推理），產出來龍去脈敘事與時間序列，並蒐集候選來源。
- `credibility-scoring`：對事件內來源與主張評定可信度、辨識官方/權威來源、輸出透明的評分理由。
- `core-topic`：將事件提煉/聚合為跨時間區間的核心議題，並以 領域×時間區間×地區 三維度分類。
- `event-feed-ui`：雙語讀者前端，三層導覽（焦點總覽→核心議題頁→事件檔案頁），含真實世界地圖地區高亮。
- `content-compliance`：管控資料保存與呈現的法律邊界（不重製全文、來源歸屬、評分免責與申訴/更正）。

### Modified Capabilities
<!-- 無既有能力被修改（greenfield 專案）。 -->

## Impact

- **新程式**：Next.js 全端專案（App Router）、資料管線（ingestion / clustering / research workers）、Anthropic SDK 整合、Postgres schema 與 migration。
- **外部相依**：Anthropic API（messages、web_search/web_fetch 工具、Batch API、Prompt Caching）、新聞來源 RSS/News API、Vercel（Hosting、Cron、Postgres 或外接 Neon/Supabase）。
- **基礎設施 / 成本**：Vercel Pro（商用＋Cron）＋ Postgres ≈ $20–45/月；AI ≈ $150–250/月（~10–30 事件/天，Sonnet 4.6 為主）。詳見 design.md 成本模型。
- **法律 / 合規**：著作權（合理使用、不重製全文）、爬蟲 ToS/robots.txt、妨害名譽/商譽（評分免責設計）。上線前需法律意見覆核。
- **無破壞性影響**：全新專案，無既有 API 或資料被改動。
