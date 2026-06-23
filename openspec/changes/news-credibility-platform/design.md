## Context

本專案是全新（greenfield）的新聞**事件**過濾與可信度平台。與一般聚合器不同，產品單位是「事件/議題」而非單篇文章：系統偵測重點時事 → 跨來源（不限語系）研究 → 排出時序、講清來龍去脈、依可信度排名來源。

**現況**：空專案，僅初始化 OpenSpec。**目標技術**：Next.js 全端、部署 Vercel（含資料庫）。**AI**：Anthropic Claude。**規模**：每天 ≤ 300 篇種子文章，分群為 ~10–30 個重點事件/天。**語言**：中／英雙語 UI。

**關鍵限制**：
- Vercel serverless function 有執行時間上限（Pro 預設 60s，啟用 Fluid Compute 後單次最長 ~800s），而 agentic 研究是多步驟工具呼叫，單一事件可能耗時數分鐘。
- 法律邊界：不重製全文、評分對事不對人、方法論透明（見 `content-compliance` spec）。

## Goals / Non-Goals

**Goals:**
- 以事件為單位，自動產出「來龍去脈 + 時間序列 + 可信來源排名」。
- 在 Vercel serverless 限制下，建立可靠、可重試、成本可控的非同步資料管線。
- AI 成本控制在每月低三位數美元（~20 事件/天）。
- 評分方法論透明、可版本化、可申訴，降低法律風險。

**Non-Goals:**
- 不做即時（秒級）突發新聞推播；以分鐘～小時級的事件整理為主。
- 不重製或代管新聞全文；不做付費牆內容繞道。
- 第一版不做個人化推薦、使用者帳號社群功能、原生 App。
- 不對「媒體機構」做整體評等（僅對單篇/單一主張評分）。

## Decisions

### D1. 擷取策略：混合式（RSS/News API 種子 + web_search 深度研究）

這是使用者明確要求比較的核心決策。

| 方案 | 角色 | 優點 | 缺點 |
|---|---|---|---|
| **A. RSS / News API** | **種子偵測（採用為主幹）** | 便宜（RSS 免費）、可控、可排程、合法性好、適合「監控固定來源」 | 需維護來源清單；覆蓋受限於有 feed 的站 |
| **B. Claude web_search / web_fetch** | **事件深度研究（採用為延伸）** | 零爬蟲維護、不限來源/語系、自動發現、自帶引用 | 每次搜尋有成本（~$10/1k，需核實）；來源不可控；不適合當持續監控 |
| **C. 純自建 HTML 爬蟲** | **未採用（僅少數無 feed 站可選用）** | 覆蓋最廣 | 維護地獄、反爬、ToS/robots 風險最高、不適合 serverless |

**決策**：**B 與 A 各司其職**。RSS/News API 負責「現在正在發生什麼」（廉價、持續、可控的種子），web_search/web_fetch 負責「把這個事件查清楚」（按需、跨來源、不限語系）。純爬蟲（C）僅在特定無 feed 的重要來源才作為例外，且須過 robots.txt 檢查。

**為何不用純 web_search 做擷取**：持續監控數十個來源若全靠搜尋，成本高且不可控，也難以建立穩定的事件追蹤。**為何不用純爬蟲**：維護成本與法律風險高，且 serverless 不適合長時間爬取。

### D2. 模型選擇與成本手段

| 階段 | 模型 | 理由 | 成本手段 |
|---|---|---|---|
| 分群 / triage | **`claude-haiku-4-5`**（$1/$5） | 高量、低難度分類，便宜即可 | **Batch API（5 折）** + Prompt Caching（共用分群指示） |
| 事件研究 + 可信度評分 | **`claude-sonnet-4-6`**（$3/$15） | 需要細緻推理、時序整理、來源判斷的主力 | Prompt Caching（共用評分 rubric）；agentic loop 不走 batch |
| 最難的時序/查證推理（可選） | **`claude-opus-4-8`**（$5/$25） | 眾說紛紜、需強推理的旗艦級事件 | 僅在重要事件選用 |

- **Prompt Caching**：評分 rubric（~2k tokens）放在快取前綴，跨同批所有事件共用，快取讀取僅 ~0.1x。
- **Batch API**：分群/triage 這類一次性、可批次的步驟用 batch 打 5 折；agentic 研究因是多步工具迴圈，不適合 batch，走即時。
- **Thinking / effort**：研究與評分用 adaptive thinking；effort 預設 `high`，對最難事件可上調。
- **Task budget**：每個事件研究設 token / 工具呼叫上限，避免單事件成本失控（見 `event-research` spec「研究有界」）。

### D3. 架構與資料流（Vercel serverless 友善的非同步管線）

管線為 **Postgres 狀態機 + Vercel Cron 觸發**，長步驟以佇列卸載：

```
[Vercel Cron 15–30m] → Ingest function
    抓 RSS/News API → upsert articles(status=new)

[Vercel Cron 30–60m] → Cluster function
    取 articles(status=new) → Haiku(Batch) 分群/triage
    → 寫/更新 events、標 importance、達門檻者 status=pending_research

[Vercel Cron 30–60m] → Research dispatcher
    取 events(status=pending_research) → 對每個 enqueue 一個研究工作 (QStash)

[QStash → Vercel function（Fluid Compute, maxDuration 提高）]
    單一事件 agentic 研究：Sonnet + web_search + web_fetch
    → 產敘事/時序/來源 → 評分 → 寫 event_*；status=researched
    → 記錄成本到 ai_runs

[Next.js App Router] 讀 Postgres → 雙語 feed / 事件詳情頁
```

**決策：用 Upstash QStash（或 Inngest）做研究步驟的佇列 + 重試**。理由：agentic 研究是多步驟、可能數分鐘、會失敗需重試；直接塞進 cron function 容易撞時間上限且無重試。QStash 是 HTTP-based、serverless、有免費額度，與 Vercel 契合，能保持「全部在 Vercel 生態」。
**替代方案**：MVP 若 ≤30 事件/天，可暫時只用 Vercel Cron + Fluid Compute（`maxDuration` 提高），每次 tick 處理少量事件，以 Postgres status 做冪等控制；待量大或穩定度需求提高再引入 QStash。

**冪等性**：每階段以 `status` 欄位 + 唯一鍵控制，重複觸發不重複處理。

### D4. 技術堆疊

- **框架**：Next.js（App Router）+ TypeScript；前端用 React Server Components 直讀 DB，互動處用 Client Components。
- **樣式**：Tailwind CSS + shadcn/ui（快速做出乾淨的雙語介面）。
- **i18n**：`next-intl`（中／英）。
- **資料庫**：Postgres —— **Neon**（serverless Postgres，與 Vercel 整合佳、有免費級）或 Vercel Postgres。ORM 用 **Drizzle**（型別安全、輕量、migration 友善）。
- **AI**：`@anthropic-ai/sdk`（TypeScript）。研究階段用 server-side `web_search_20260209` + `web_fetch_20260209` 工具（內建 dynamic filtering），以 agentic loop / tool runner 驅動。
- **佇列/排程**：Vercel Cron + Upstash QStash。
- **觀測**：`ai_runs` 表記錄每次呼叫的 token/搜尋/成本；Vercel logs。

### D5. 資料模型（Postgres schema 摘要）

```
sources(id, name, type[rss|news_api|crawler], url, language,
        baseline_credibility, enabled, created_at)

articles(id, source_id→sources, canonical_url UNIQUE, title, snippet,
         published_at, language, raw_content_ref?, raw_expires_at?,
         event_id?→events, is_duplicate_of?→articles,
         status[new|clustered|skipped], fetched_at)

events(id, slug UNIQUE, title_zh, title_en, topic_tags[],
       importance_score, overall_reliability[verified|developing|disputed|unverified],
       narrative_zh, narrative_en, rubric_version,
       status[candidate|pending_research|researched|updating],
       first_seen_at, last_updated_at)

event_timeline(id, event_id→events, occurred_at, desc_zh, desc_en,
               source_ref(article_id?|url?), is_conflicting, created_at)

event_sources(id, event_id→events, article_id?→articles, external_url?,
              source_id?→sources, credibility_score,
              credibility_tier[high|medium|low|unverified],
              is_authoritative, reasoning_zh, reasoning_en,
              rubric_version, rank)

rubric_versions(version PK, content, created_at)

appeals(id, event_id?, event_source_id?, submitter, claim,
        status[open|reviewing|resolved], created_at, resolved_at?)

ai_runs(id, event_id?, stage[cluster|research|score], model,
        input_tokens, output_tokens, cache_read_tokens, web_searches,
        cost_usd, batch_id?, created_at)
```

### D6. 可信度評分方法論（法律安全設計）

- 評分對象是**單篇報導 / 單一主張**，輸出分級（high/medium/low/unverified）+ 文字理由 + 依據引用。
- **不**輸出對「媒體機構」的概括人格評等；`sources.baseline_credibility` 僅作內部排序提示，不對外呈現為對該媒體的評斷。
- rubric 以 `rubric_versions` 版本化，每筆評分記錄所用版本，供稽核與申訴。
- 前端在評分處附「依公開方法論之評估意見」聲明與方法論連結（見 `content-compliance`）。
- 整體事件可靠度（如「眾說紛紜，官方尚未證實」）由來源一致性 + 是否有官方/一手來源推導。

### D7. 成本模型（每月，~20 事件/天基準）

**單位成本假設**：分群每篇 ~2.5k in / 0.1k out；事件研究每件 ~40k in（含抓取內容）/ ~3k out + 5–15 次 web_search。

| 項目 | 估算 | 月成本 |
|---|---|---|
| 擷取（RSS） | 免費；News API 視方案 | $0–449 |
| 分群（Haiku + Batch + cache，~300/天） | ~$0.0015/篇 | **~$10–15** |
| 事件研究+評分（Sonnet agentic，~20/天） | ~$0.27/件 | **~$160** |
| 基礎設施（Vercel Pro + Neon + QStash） | — | **~$20–45** |
| **合計（Sonnet 主力）** | | **~$190–220** |
| 若改用 Opus 4.8 研究 | ~$0.35/件 | 研究 ~$210，合計 ~$240–275 |

**規模敏感度（僅 AI，Sonnet）**：10 事件/天 ≈ $90；20 ≈ $170；30 ≈ $250（含分群）。
> 註：Anthropic 定價為最新確認值（Haiku $1/$5、Sonnet $3/$15、Opus $5/$25，Batch 5 折，快取讀取 ~0.1x）。`web_search` 約 $10/1k 次與 News API/Vercel/Neon 方案價格於實作時逐項核實。

## Risks / Trade-offs

- **[Agentic 研究撞 serverless 時間上限]** → 用 QStash 卸載 + 提高 `maxDuration`（Fluid Compute）；每事件設 task budget 收斂。
- **[單事件成本失控]** → 每事件設工具呼叫/token 上限；`ai_runs` 監控；超標告警。
- **[AI 評分錯誤造成名譽風險]** → 對事不對人、方法論透明、申訴機制、上線前法律覆核；高風險評分可加人工覆核閘。
- **[web_search 來源品質參差/幻覺]** → 要求每個主張附可點擊來源；衝突說法並陳；官方/一手來源優先。
- **[著作權]** → 不公開全文、只摘要+連結、原始全文設保存期限後清除。
- **[來源 ToS/robots 變動]** → 來源註冊表可停用；尊重 opt-out/撤下請求。
- **[跨語系分群錯誤]** → 以語意嵌入/模型判斷分群，保留人工合併/拆分後門。

## Migration Plan

全新專案，無資料遷移。部署順序：
1. 建 Next.js 專案骨架 + Drizzle schema + Neon 連線，跑首次 migration。
2. 實作 ingest（RSS）→ 確認 articles 入庫。
3. 實作 cluster（Haiku/Batch）→ 確認 events 生成。
4. 實作 research+score（Sonnet + web_search，先同步版）→ 確認單事件檔案產出。
5. 接上 QStash 佇列與 Vercel Cron 排程。
6. 前端 feed + 詳情頁（雙語）。
7. 合規元件（免責、申訴、保存期限 job）。
8. 部署 Vercel，設環境變數與 Cron。
**Rollback**：各階段獨立、以 feature flag/Cron 開關控制，可單獨停用某階段而不影響前端讀取既有資料。

## Open Questions

- News API 是否採用（哪一家／方案），或先純 RSS 起步？
- 來源清單初始白名單（哪幾個主要新聞網站）由誰定義？
- 是否需要對「高風險評分」加人工覆核閘（第一版可選）？
- `web_search` 實際計價與速率限制需以實測核實，再回填成本模型。
- 是否需要管理後台（來源管理、申訴處理）於第一版，或先用 DB 直接操作？

---

## 設計修訂 v2 — 核心議題 / 真實地圖 / 本地 Postgres / 對齊 trace

依使用者回饋與 trace 慣例移植，更新以下決策（取代上文相關處）：

**IA 改為三層**：焦點總覽 → 核心議題頁 → 事件檔案頁（取代原兩層 feed/event）。
- 新增 `core-topic` 實體：`Topic` 聚合多個 `Event`（可跨時間區間）；分類維度 `領域 × 時間區間 × 地區`。
- 「由核心點往外擴散」= 議題頁以時間軸呈現旗下事件（分支時間軸；可後續改放射星圖）。

**地區與地圖**：
- 事件研究階段標註 `region`（用「國家 → 宏觀區域」對照表：中東/東亞/東南亞/南亞/中亞/歐洲/北美/南美/非洲/大洋洲）。
- 總覽地圖用**真實地理邊界**：`d3-geo` + `topojson-client` + `world-atlas`（countries TopoJSON），依 region 對照高亮 — **禁止幾何示意圖**（Hard Rule）。

**DB 與堆疊（對齊 trace）**：
- 開發資料庫改 **本地 PostgreSQL**（`DATABASE_URL=postgresql://localhost...`）；prod 再換 Neon/Vercel Postgres。
- ORM 改用 **Prisma**（取代先前 Drizzle 決策），client 生成至 `lib/generated/prisma`，singleton 於 `lib/prisma.ts`。
- 堆疊比照 trace：Next.js 15 / React 19 / Tailwind v4 / shadcn / i18next（`en` + `zh-Hant`）/ Redux Toolkit / React Query / Zod / react-hook-form；前台 fetch 走 `apiFetch`、API route 走 `apiHandler`、回傳 `ApiResponse<T>`。

**Schema 增補**（Prisma）：
- `Topic`（slug、title_zh/en、domain、interval、regions[]、overall_reliability、span 起訖、status、計數）。
- `Event` 增 `topicId`、`regions[]`。其餘 `event_timeline`/`event_sources`/`articles`/`sources`/`rubric_versions`/`appeals`/`ai_runs` 沿用（改為 Prisma model）。
- `Region` 以 enum/字串列舉；事件與議題皆可掛多個 region。

**路由**：`/[lng]`（焦點總覽）、`/[lng]/topic/[slug]`（議題頁）、`/[lng]/event/[slug]`（事件頁）。

**Open Questions 更新**：ORM/DB 已定（Prisma + 本地 PG）；地圖已定（真實 TopoJSON）；議題頁採分支時間軸；地區顆粒度採「宏觀區域」（非到國家），可後續細化。
