## Tasks

### 聚焦網域（event-clustering / core-topic）
- [ ] `lib/enums.ts` 新增 `FOCUS_DOMAINS` 與 `isFocusDomain`
- [ ] `lib/pipeline/cluster.ts`：非白名單網域的群組標 `SKIPPED`、不建立事件
- [ ] `app/[lng]/page.tsx`：總覽只取白名單網域議題
- [ ] `scripts/purge-offdomain.ts`：清除既有離題議題/事件（Neon）

### 來源後設資訊（event-research / core-topic）
- [ ] `prisma/schema.prisma`：`EventSource` 加 `language` `mediaType`
- [ ] `lib/enums.ts`：`normalizeMediaType`
- [ ] `lib/pipeline/research.ts`：prompt 要求 language/mediaType，寫入欄位
- [ ] `lib/pipeline/topics.ts`：`refreshTopicStats` 計算真實 `languageCount`
- [ ] `prisma db push` 套用至 Neon + `prisma generate`

### 導覽與研究中（event-feed-ui）
- [ ] `components/Breadcrumb.tsx`：共用麵包屑元件
- [ ] `app/[lng]/event/[slug]/page.tsx`：麵包屑 + 研究中狀態 + 來源徽章
- [ ] `app/[lng]/topic/[slug]/page.tsx`：麵包屑 + 事件研究中徽章
- [ ] i18n：`event.researching`、`nav.overview`、`source.*` 等鍵（zh/en 同步）

### 驗證
- [ ] `pnpm build` 通過
- [ ] 部署後線上事件頁顯示麵包屑與來源徽章、總覽無離題議題
