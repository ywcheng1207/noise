## Tasks

### Schema
- [ ] `prisma/schema.prisma`：新增 `TopicLifecycle`、`CandidateStatus` enum
- [ ] `Topic` 新增 `lifecycle`、`charterWhyZh/En`、`charterCriteriaZh/En`、`charterActorsZh/En`、`digestZh/En`、`lastActivityAt`、`dormantAt`、`archivedAt`
- [ ] `Event` 新增 `closedAt`、`corroborationCount`、`refreshedAt`
- [ ] 新增 `TopicLink` model（`fromTopicId`/`toTopicId`/`noteZh`/`noteEn`，unique on pair）
- [ ] 新增 `ThreadCandidate` model
- [ ] `prisma db push`（本地）+ `prisma generate`；記錄需在合併前對 Neon 也執行一次

### 調校參數
- [ ] `lib/pipeline/config.ts`（新檔，比照 `lib/gemini.ts` 的常數集中寫法）：`FOLLOW_UP_WINDOW_HOURS`、`REFRESH_THRESHOLD`、`TOPIC_DORMANT_DAYS`、`TOPIC_ARCHIVE_DAYS`、`ACTIVE_THREAD_CAP`、`DAILY_BUDGET_USD`

### 分流（取代 cluster.ts 的分群邏輯）
- [ ] `lib/pipeline/routing.ts`（新檔，取代 `cluster.ts` 職責）：讀取 `ACTIVE` 脈絡（憲章摘要 + 各脈絡最近 5 個 `OPEN` 事件標題）作為分流上下文
- [ ] 分流 prompt：輸出每個叢集的分類（mainline-existing / mainline-fastgate / follow-up / candidate / noise）+ 對應脈絡/事件 id（既有脈絡情況）+ 快門新脈絡的憲章草稿（快門情況）
- [ ] mainline-existing：建立 `Event`，`topicId` 直接寫入，不再呼叫 `assignEventToTopic`
- [ ] mainline-fastgate：建立 `Topic`（含憲章、`lifecycle=ACTIVE`）+ 首個 `Event`
- [ ] follow-up：文章關聯既有 `Event`，`corroborationCount += 1`，若 `Event.status='CLOSED'` 則轉回 `OPEN` 並清空 `closedAt`；若所屬 `Topic.lifecycle='DORMANT'` 則轉回 `ACTIVE`
- [ ] candidate：upsert `ThreadCandidate`（依標題相似度去重）
- [ ] noise：文章標記 `SKIPPED`
- [ ] 移除 `lib/pipeline/cluster.ts`（職責併入 `routing.ts`）與 `topics.ts` 內的 `assignEventToTopic`（職責併入分流）
- [ ] `refreshTopicStats()` 保留，行為不變

### 續報可信度升級（純規則）
- [ ] `lib/pipeline/corroboration.ts`（新檔）：`UNVERIFIED→DEVELOPING`（首則續報）、`DEVELOPING→VERIFIED`（達 `REFRESH_THRESHOLD`）的純函式，分流的 follow-up 分支呼叫

### 研究（research.ts 擴充）
- [ ] `researchEvent()`：prompt 新增所屬脈絡現有 `digestZh/En` 作為上下文（若有），回應 schema 新增 `topicDigestZh/En`；完成後寫回 `Topic.digestZh/En` 與 `lastActivityAt`
- [ ] 新增 `refreshEvent()`（輕量研究）：輸入既有 narrative/timeline/sources + 續報以來的新文章，prompt 明確要求「增量更新」；沿用 `resolveVerifiedUrl` 驗證新增網址；完成後設定 `refreshedAt`
- [ ] `researchEvent()`/`refreshEvent()` 完成後依 `FOLLOW_UP_WINDOW_HOURS` 邏輯維持/設定 `Event.status`（`OPEN`）

### 事件關閉（排程檢查）
- [ ] 新增輕量函式（可掛在既有 research cron 或新建 cron）：掃描 `OPEN` 且超過 `FOLLOW_UP_WINDOW_HOURS` 無新續報（比對 `lastUpdatedAt` 或新增的續報時間戳）的事件，轉為 `CLOSED`

### 脈絡治理（新能力）
- [ ] `lib/pipeline/governance.ts`（新檔）：`runEditorialMeeting()`
  - [ ] 讀取所有 `ACTIVE`/`DORMANT` 脈絡（憲章摘要 + `lastActivityAt`/`dormantAt`）+ 所有 `WATCHING` 候選
  - [ ] 一次 Gemini 呼叫，輸出：衰退建議（ACTIVE→DORMANT、DORMANT→ARCHIVED，含終局判定）、候選轉正建議（含起草憲章）、候選淘汰建議
  - [ ] 程式邏輯依 `TOPIC_DORMANT_DAYS`/`TOPIC_ARCHIVE_DAYS` 交叉驗證衰退建議（避免 AI 誤判未達門檻的脈絡）
  - [ ] 程式邏輯執行 `ACTIVE_THREAD_CAP` 上限：轉正案超額時依證據強度篩選，仍超過時強制衰退活動時間最舊的 `ACTIVE` 脈絡
  - [ ] 轉正的候選：建立 `Topic`（憲章 + `lifecycle=ACTIVE`）、建立首個 `Event`（用候選累積的種子文章跑一次完整研究）、候選狀態轉 `PROMOTED`
  - [ ] 淘汰的候選：狀態轉 `DISMISSED`
- [ ] `consolidateTopics()`：查詢條件加上只比對 `lifecycle IN (ACTIVE, DORMANT)`

### 每日成本熔斷
- [ ] `lib/pipeline/budget.ts`（新檔）：查當日（UTC）`AiRun.costUsd` 總和，提供 `isOverDailyBudget()`
- [ ] 完整研究、輕量研究、編輯會議、脈絡收斂呼叫前檢查熔斷；分流不受影響

### Cron 路由
- [ ] `app/api/cron/cluster/route.ts` 改呼叫 `routing.ts`（或新建 `app/api/cron/routing/route.ts` 並移除舊路由，依實作時對現有排程設定的影響決定）
- [ ] `app/api/cron/research/route.ts`：擴充同時處理「`PENDING_RESEARCH`（完整研究）」與「達續報門檻的 `OPEN` 事件（輕量研究）」兩類佇列
- [ ] 新增 `app/api/cron/editorial/route.ts`：每日觸發一次 `runEditorialMeeting()`
- [ ] Vercel 專案設定新增/調整對應 Cron Job 排程（editorial 為每日一次；其餘沿用現有頻率）

### 遷移
- [ ] `scripts/migrate-thread-charters.ts`：讀出既有 38 議題 + events → 一次 Gemini 呼叫收斂為初始脈絡集合並起草憲章 → 依建議合併（沿用 `consolidateTopics` 的合併機制）或直接補寫憲章欄位 → 不重新研究既有事件
- [ ] 本地執行 + 人工檢視收斂結果，確認合理後再對 Neon 執行

### 前端（event-feed-ui）
- [ ] 議題頁：顯示脈絡憲章（為什麼重要／收錄判準／目前態勢滾動摘要）區塊
- [ ] 議題頁：顯示連動脈絡（可點擊前往）
- [ ] 議題總覽：`DORMANT` 脈絡視覺標記；預設篩選排除 `ARCHIVED`，另提供顯示已封存的篩選選項
- [ ] 新增候選池頁面/區塊：列出 `WATCHING` 候選（標題 + 觀察理由），從議題分頁可進入
- [ ] 事件頁：顯示累積續報數與（如有）續報帶動的可信度升級

### i18n
- [ ] 新增憲章相關文案 key（為什麼重要／收錄判準／目前態勢／連動脈絡／候選池／觀察中／休眠／已封存／續報數）中英同步

### 驗證
- [ ] `pnpm build` 通過
- [ ] 本地以既有資料跑一次遷移腳本，確認收斂後脈絡數落在上限附近、憲章文字合理
- [ ] 本地手動觸發分流，確認 mainline/follow-up/candidate/noise 四類行為皆符合預期
- [ ] 本地手動觸發編輯會議，確認生命週期轉換與候選轉正/淘汰符合預期、上限確實被程式邏輯把關
- [ ] Preview 驗證：議題頁憲章顯示、候選池頁面、休眠/封存視覺區隔、事件頁續報數，中英雙語

### Sync & Archive
- [ ] delta spec 套回 `openspec/specs/{core-topic,event-clustering,event-research,event-feed-ui}/spec.md`，新建 `openspec/specs/thread-governance/spec.md`
- [ ] `git mv` 至 `openspec/changes/archive/thread-charter/`
