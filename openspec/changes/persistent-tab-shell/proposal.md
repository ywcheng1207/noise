## Why

焦點總覽現在是「介紹 / 議題」兩個 tab，但點進議題卡片、事件卡片、日誌，會整頁跳轉離開 tab 外殼，麵包屑也另外顯示在 navbar——三層資訊架構（總覽→議題→事件）在互動上變成三個各自獨立的頁面，而非同一個殼裡的內容抽換。讀者在瀏覽議題/事件/日誌時會失去「自己在哪個分頁」的視覺錨點。

## What Changes

- **持續存在的 Tabs 外殼**：介紹／議題／日誌三個 tab 在整個瀏覽期間都不會消失；點進議題卡片、事件卡片、日誌明細，都只是「議題」或「日誌」tab 內容區的抽換，不是離開殼層的整頁跳轉。
- **路由分組**：`page.tsx`、`topic/[slug]`、`event/[slug]`、`log`、`log/[date]` 移到 `app/[lng]/(shell)/` route group，共用一個渲染 Tabs 外殼的 layout；`terms` 頁不受影響（維持原本無 Tabs 的獨立頁面）。
- **Tab 由路徑決定**：`/log*` 一律高亮「日誌」、`/topic/*`、`/event/*` 一律高亮「議題」；只有在總覽根路徑 `/{lng}` 時才由本地 state 決定顯示「介紹」或「議題」（沿用目前預設 defaultValue='intro' 的行為）。點擊「日誌」或（非根路徑時的）「議題」會觸發導航；已經在根路徑時點「議題」/「介紹」純粹是本地切換，不導頁。
- **麵包屑搬進 tab 內容區**：現有 `@breadcrumb` parallel route 沿用（隨路由移入 `(shell)`），但改成渲染在 tab 內容區塊頂部，不再顯示於 navbar。
- **介紹 tab 內容擴充**：更名「逆風」→「介紹」，除了開場白，新增「怎麼整理資訊」（來源擷取→事件分群→AI 跨來源研究）與「可信度怎麼判斷」（議題四級 + 來源五級的判斷依據）兩個段落，中英皆補齊，內容需與現有 Terms of Service 可信度條款、pipeline 實際邏輯一致，不可杜撰未實作的功能。
- **文案調整**：總覽開場白全文重寫；「來龍去脈」統一改稱「摘要」（事件頁段落標題、研究中提示文案、SEO meta description）。
- **順手修復**（與此次殼層改動同批次，不足以獨立成 change）：`useIncrementalReveal` 的 sentinel 用 callback ref 取代 `useRef` + 依賴陣列 effect，修掉捲動到底部時 loading 圖示卡住不消失的 bug；`DateRangePicker` 觸發按鈕高度對齊 `SearchInput`。

## Impact

- **前端**：`event-feed-ui` capability——新增 `(shell)` route group + 持續存在的 Tabs 外殼；`OverviewClient` 拆分（Tabs 殼層上移，自身只剩議題清單）；`@breadcrumb` slot 渲染位置改變；Log 頁面併入殼層但邏輯不變。
- **路由**：URL 結構不變（route group 不影響路徑），僅共用 layout 改變，不影響既有連結、SEO、深連結。
- **無 schema 變動**。
