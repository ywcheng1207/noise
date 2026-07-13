## 1. 共用元件

- [ ] 1.1 抽出 `components/DomainTag.tsx`，`OverviewClient.tsx` 改為 import 使用

## 2. 路由與殼層

- [ ] 2.1 `TabShell.tsx`：新增 `latest` 分頁（介紹／最新／議題／日誌），路由行為比照「日誌」（獨立路徑，非根路徑共用）
- [ ] 2.2 `app/[lng]/(shell)/layout.tsx`：傳入 `latest` 分頁標籤
- [ ] 2.3 新增 `app/[lng]/(shell)/latest/page.tsx`（server component，查詢最近 150 筆 `Article`，join `event.topic`）
- [ ] 2.4 新增 `app/[lng]/(shell)/latest/_components/LatestArticlesList.tsx`（client component，漸進揭露 + 收折列）
- [ ] 2.5 新增 `app/[lng]/(shell)/@breadcrumb/latest/page.tsx`

## 3. 文案

- [ ] 3.1 新增 `nav.latest`、`latest.*` i18n keys（中英）
- [ ] 3.2 `overview.subtitle` 補上「實際新聞內容請參考原文」（中英）

## 4. 驗證

- [ ] 4.1 `tsc --noEmit` / `pnpm build` 通過
- [ ] 4.2 瀏覽器驗證：分頁順序、三種狀態（NEW/CLUSTERED/SKIPPED）皆正確顯示、展開後議題連結可正確跳轉、中英雙語、手機版
- [ ] 4.3 sync delta 進 `openspec/specs/event-feed-ui/spec.md`，archive 此 change
