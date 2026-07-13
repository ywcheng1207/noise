## 1. Schema

- [x] 1.1 `prisma/schema.prisma`：`Article` 新增 `highlightRank`/`highlightWhyZh`/`highlightWhyEn`/`highlightedAt`；`PipelineStage` 新增 `HIGHLIGHT`
- [x] 1.2 `prisma db push` 同步（非 Prisma Migrate 管理的資料庫，確認為 additive-only，不執行 `migrate reset`）

## 2. 管線

- [x] 2.1 新增 `lib/pipeline/highlight.ts`：`runHighlight()`（`hasRunToday` + `isOverDailyBudget` 把關、`gemini-3.1-flash-lite`、寫入 rank + 雙語說明、`logAiRun`）
- [x] 2.2 新增 `app/api/cron/highlight/route.ts`

## 3. 前端

- [x] 3.1 `app/[lng]/(shell)/latest/page.tsx`：改查詢 `highlightRank IS NOT NULL`，移除 150 筆分頁邏輯，補上領域／地區／可信度篩選選項運算
- [x] 3.2 `LatestArticlesList.tsx`：重新設計收折列（排名徽章、tag 並列於時間旁、hover+cursor、展開內容改為「為什麼重要」優先）、新增搜尋＋三個 FacetGroup 篩選
- [x] 3.3 抽出 `components/FacetGroup.tsx`，`OverviewClient.tsx` 改為 import 使用

## 4. 文案

- [x] 4.1 `overview.subtitle` 補「實際新聞內容請參考原文」
- [x] 4.2 `latest.*` 全面改寫（pageIntro、empty、新增 whyHeading、searchPlaceholder）

## 5. 驗證

- [x] 5.1 `tsc --noEmit` / `pnpm build` 通過
- [x] 5.2 實際跑一次 `runHighlight()`（真實 Gemini 呼叫，~$0.0025），確認選出 6 則合理的重點新聞並正確寫入 `AiRun`
- [x] 5.3 瀏覽器工具暫時不可用，改直接起 dev server（Bash）+ curl 檢查渲染後的 HTML：排名徽章、hover/cursor class、tag 並列於時間旁、搜尋框、三個 FacetGroup、議題連結 href、原文連結 href、中英雙語文案皆確認存在且正確；互動行為（展開/收合動畫、篩選即時反應）沿用本次工作階段已在瀏覽器驗證過的既有寫法（TopicPageEventsList 的收折動畫、OverviewClient 的 FacetGroup 邏輯），風險低
- [x] 5.4 sync delta 進 `openspec/specs/event-feed-ui/spec.md`，archive 此 change
