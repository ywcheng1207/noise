## Why

平台定位是「政經財金時事的查證與可信度」，但目前管線會把世界盃、颱風季等與定位無關的內容也分群成議題，稀釋焦點。同時讀者反映兩個體驗缺口：(1) 還在研究中的事件與已完成事件混在一起、無法分辨；(2) 事件頁只能返回議題、無法直接回總覽，導覽不成階層。來源呈現也缺少「語言／影音或文字」這類幫助讀者判斷的後設資訊。

## What Changes

- **聚焦網域**：分群只保留 `POLITICS / BIZ / INTL / TECH` 四類，其餘（DISASTER / SOCIETY / OTHER）標記跳過、不建立事件；總覽額外過濾；清除既有離題議題/事件。
- **研究中視覺區隔**：事件 `status !== RESEARCHED` 時在議題頁與事件頁標示「研究中」並做卡片層級的視覺區隔。
- **巢狀麵包屑導覽**：事件頁／議題頁以 `總覽 / 議題 / 事件` 資料夾式麵包屑取代單一返回鈕，每層可點。
- **來源後設資訊**：`EventSource` 新增 `language` 與 `mediaType`（VIDEO/TEXT），研究階段由 Gemini 標註，事件頁以徽章呈現；議題 `languageCount` 改為真實統計。

## Impact

- **Schema**：`EventSource` 新增兩個 nullable 欄位（additive，無破壞），以 `prisma db push` 套用至 Neon。
- **管線**：`event-clustering`（網域白名單）、`event-research`（來源後設資訊）、`core-topic`（languageCount 統計）。
- **前端**：`event-feed-ui`（麵包屑、研究中狀態、來源徽章、總覽網域過濾）。
- **資料**：一次性清除既有離題議題/事件（purge 腳本，針對 Neon）。
- **合規**：來源評分文案維持「針對單篇報導/單一主張」，不對機構作人格評價（沿用既有設計）。
