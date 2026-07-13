## Why

「最新」分頁上一輪（latest-articles-tab）做成「最近 150 筆依時間排序」的原始清單，合併前使用者複查後認為：單純時間排序資訊量太大、不易判斷哪些真正重要；且缺少篩選/搜尋、tag 位置、hover 回饋等基本可用性。這批修正把分頁改為「AI 每日精選最多 10 則重點新聞＋為什麼重要的說明」，同時補齊互動細節。

## What Changes

- **AI 精選重點（新管線階段）**：新增 `lib/pipeline/highlight.ts`（`runHighlight`），每日一次（比照編輯會議的 `hasRunToday` idempotency）從最近 150 筆文章中，由 AI（`gemini-3.1-flash-lite`）判斷對全球讀者最重要的最多 10 則，並為每則寫一段雙語說明（為什麼重要＋理解所需背景知識）。新增 `app/api/cron/highlight/route.ts` 觸發入口。**不在頁面請求時即時呼叫 AI**——頁面只讀取已寫入資料庫的結果。
- **Schema 變動**：`Article` 新增 `highlightRank`、`highlightWhyZh`、`highlightWhyEn`、`highlightedAt`（皆為 nullable，`db push` 同步，非破壞性）；`PipelineStage` enum 新增 `HIGHLIGHT`。
- **「最新」分頁改為精選清單**：`page.tsx` 改查詢 `highlightRank IS NOT NULL`（至多 10 筆，依排名排序），移除原本 150 筆 + 漸進揭露的邏輯（資料量已有上限，不需要）。
- **收折列重新設計**：標籤（議題領域／可信度，或未收攏狀態）直接並列在擷取時間旁；展開後主要內容改為「為什麼重要」說明，其次才是原文連結／議題連結；新增排名徽章。
- **互動細節修正**：收折列的觸發按鈕補上 hover 背景效果與 `cursor-pointer`（比照日誌頁收折觸發的既有寫法）。
- **篩選與搜尋**：仿「議題」總覽頁的 `FacetGroup`（領域／地區／可信度，單選）＋關鍵字搜尋（比對標題、說明文字、所屬議題標題）；抽出 `components/FacetGroup.tsx` 供兩處共用。
- **文案**：`overview.subtitle` 補上「實際新聞內容請參考原文」；`latest.*` 全面改寫以符合新行為。

## Impact

- **前端**：`event-feed-ui` capability——「最新」分頁的資料來源與呈現方式改變（見上）。
- **後端管線**：新增一個獨立的每日 AI 判斷階段，成本極低（單次 flash-lite 呼叫，~$0.0025／次），與既有 `budget.ts` 每日成本熔斷整合。
- **Schema**：新增 4 個 nullable 欄位＋1 個 enum 值，透過 `prisma db push` 同步（此專案資料庫非 Prisma Migrate 管理，`db push` 是既有慣例）。
