## Tasks

- [ ] `useIncrementalReveal`：sentinel 改 callback ref，修 spinner 卡住不消失
- [ ] `DateRangePicker` 觸發按鈕高度對齊 `SearchInput`
- [ ] 路由搬遷：`page.tsx`、`topic/[slug]`、`event/[slug]`、`log`、`log/[date]` + 對應 `@breadcrumb` 移進 `app/[lng]/(shell)/`
- [ ] 新建 `(shell)/layout.tsx` + `TabShell` client component（介紹／議題／日誌三個 tab，路徑決定 active tab，麵包屑移入內容區）
- [ ] `app/[lng]/layout.tsx` 移除 navbar 的麵包屑渲染
- [ ] `OverviewClient` 拆掉自己的 Tabs 包裝，只剩議題清單
- [ ] 新建「介紹」內容：開場白（新文案）＋ 資訊整理方式段落 ＋ 可信度判斷段落（中英）
- [ ] 文案：`overview.subtitle` 重寫、`event.background`／`researchingHint`／SEO description 的「來龍去脈」改「摘要」（中英）
- [ ] Preview 驗證：深連結到 topic/event/log 直接開啟時 active tab 與麵包屑正確；任兩個 tab 互切在各種路徑下都正確；捲動到底 spinner 會消失；日期選取器高度對齊；介紹 tab 雙語顯示正確
- [ ] sync spec、archive change
