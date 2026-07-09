## Tasks

### Schema
- [x] `prisma/schema.prisma`：新增 `TopicLifecycle`、`CandidateStatus` enum
- [x] `Topic` 新增 `lifecycle`、`charterWhyZh/En`、`charterCriteriaZh/En`、`charterActorsZh/En`、`digestZh/En`、`lastActivityAt`、`dormantAt`、`archivedAt`
- [x] `Event` 新增 `closedAt`、`corroborationCount`、`refreshedAt`
- [x] 新增 `TopicLink` model（`fromTopicId`/`toTopicId`/`noteZh`/`noteEn`，unique on pair）
- [x] 新增 `ThreadCandidate` model
- [x] `prisma db push`（本地）+ `prisma generate`；記錄需在合併前對 Neon 也執行一次

### 調校參數
- [x] `lib/pipeline/config.ts`（新檔，比照 `lib/gemini.ts` 的常數集中寫法）：`FOLLOW_UP_WINDOW_HOURS`、`REFRESH_THRESHOLD`、`TOPIC_DORMANT_DAYS`、`TOPIC_ARCHIVE_DAYS`、`ACTIVE_THREAD_CAP`、`DAILY_BUDGET_USD`

### 分流（取代 cluster.ts 的分群邏輯）
- [x] `lib/pipeline/routing.ts`（新檔，取代 `cluster.ts` 職責）：讀取 `ACTIVE`/`DORMANT` 脈絡（憲章摘要 + 各脈絡最近 5 個 `OPEN` 事件標題）作為分流上下文
- [x] 分流 prompt：輸出每個叢集的分類（mainline_existing / mainline_fastgate / follow_up / candidate / noise）+ 對應脈絡/事件 slug（既有脈絡情況）+ 快門新脈絡的憲章草稿（快門情況）
- [x] mainline_existing：建立 `Event`，`topicId` 直接寫入，不再呼叫 `assignEventToTopic`
- [x] mainline_fastgate：建立 `Topic`（含憲章、`lifecycle=ACTIVE`）+ 首個 `Event`
- [x] follow_up：文章關聯既有 `Event`，`corroborationCount += 1`，若原本 `closedAt` 非空則清空（重新打開）；若所屬 `Topic.lifecycle='DORMANT'` 則轉回 `ACTIVE`
- [x] candidate：upsert `ThreadCandidate`（依標題完全相同去重，見 design.md 的簡化取捨）
- [x] noise：文章標記 `SKIPPED`
- [x] 移除 `lib/pipeline/cluster.ts`（職責併入 `routing.ts`）與 `topics.ts` 內的 `assignEventToTopic`（職責併入分流）
- [x] `refreshTopicStats()` 保留，行為不變

### 續報可信度升級（純規則）
- [x] `lib/pipeline/corroboration.ts`（新檔）：`UNVERIFIED→DEVELOPING`（首則續報）、`DEVELOPING→VERIFIED`（達 `REFRESH_THRESHOLD`）的純函式，分流的 follow-up 分支呼叫

### 研究（research.ts 擴充）
- [x] `researchEvent()`：prompt 新增所屬脈絡現有 `digestZh/En` 作為上下文（若有），回應 schema 新增 `topicDigestZh/En`；完成後寫回 `Topic.digestZh/En` 與 `lastActivityAt`
- [x] 新增 `refreshEvent()`（輕量研究）：輸入既有 narrative/timeline/sources + 完整種子文章清單，prompt 明確要求「增量更新」；沿用 `resolveVerifiedUrl` 驗證網址；完成後設定 `refreshedAt`
- [x] `researchEvent()`/`refreshEvent()` 完成後事件維持 `OPEN`（`closedAt` 不受影響，由獨立的 `closeStaleEvents()` 掃描處理）

### 事件關閉（排程檢查）
- [x] `closeStaleEvents()`（`research.ts`）：掃描 `OPEN` 且超過 `FOLLOW_UP_WINDOW_HOURS` 無新續報（`lastUpdatedAt` 早於門檻）的已研究事件，轉為 `CLOSED`；掛在 `research` cron 每次觸發時執行

### 脈絡治理（新能力）
- [x] `lib/pipeline/governance.ts`（新檔）：`runEditorialMeeting()`
  - [x] ACTIVE→DORMANT 純規則（不經 AI，只看 `lastActivityAt`）
  - [x] 讀取所有 `DORMANT` 脈絡 + 所有 `WATCHING` 候選，一次 Gemini 呼叫，輸出：DORMANT→ARCHIVED 建議（含終局判定）、候選轉正建議（含起草憲章 + evidenceStrength）、候選淘汰建議
  - [x] 程式邏輯執行 `ACTIVE_THREAD_CAP` 上限：轉正案依 evidenceStrength 排序、超額時保留高分者，仍超過時強制衰退活動時間最舊的 `ACTIVE` 脈絡
  - [x] 轉正的候選：建立 `Topic`（憲章 + `lifecycle=ACTIVE`）、建立首個 `Event`（`status=PENDING_RESEARCH`，交由一般研究佇列處理；候選池未追蹤實際種子文章，見 design.md 簡化取捨）、候選狀態轉 `PROMOTED`
  - [x] 淘汰的候選：狀態轉 `DISMISSED`
- [x] `consolidateTopics()`：查詢條件加上只比對 `lifecycle IN (ACTIVE, DORMANT)`

### 每日成本熔斷
- [x] `lib/pipeline/budget.ts`（新檔）：查當日（UTC）`AiRun.costUsd` 總和，提供 `isOverDailyBudget()`
- [x] 完整研究、輕量研究、編輯會議、脈絡收斂呼叫前檢查熔斷；分流不受影響

### Cron 路由
- [x] `app/api/cron/cluster/route.ts` 路徑不變，內部改呼叫 `routing.ts`（避免另外去 Vercel 改排程設定）
- [x] `app/api/cron/research/route.ts`：擴充同時處理「`PENDING_RESEARCH`（完整研究）」與「達續報門檻的 `OPEN` 事件（輕量研究）」兩類佇列，並執行 `closeStaleEvents()`
- [x] 新增 `app/api/cron/editorial/route.ts`：觸發 `runEditorialMeeting()`
- [ ] Vercel 專案設定新增 `editorial` 的 Cron Job 排程（建議每日一次）——**需要 Vercel dashboard 存取權限，AI 無法代為操作，請使用者自行新增**

### 遷移
- [x] `scripts/migrate-thread-charters.ts`：讀出既有議題 + events → 一次 Gemini 呼叫收斂為初始脈絡集合並起草憲章 → 依建議合併（沿用 `consolidateTopics` 的合併機制）或直接補寫憲章欄位 → 不重新研究既有事件
- [x] 本地執行 + 人工檢視收斂結果：38 議題收斂為 11 個帶憲章脈絡（10 ACTIVE + 1 DORMANT，符合 12 上限），憲章文字（為什麼重要/收錄判準含排除條件/關鍵行為者/初始滾動摘要）品質良好，無孤兒議題

### 前端（event-feed-ui）
- [x] 議題頁：顯示脈絡憲章（為什麼重要／收錄判準／目前態勢滾動摘要／關鍵行為者）區塊，無憲章資料時不顯示
- [x] 議題頁：顯示連動脈絡（可點擊前往）
- [x] 議題總覽：`DORMANT`/`ARCHIVED` 脈絡視覺標記（`LifecycleBadge`）；預設篩選排除 `ARCHIVED`，另提供「顯示已封存」篩選切換
- [x] 新增候選池頁面 `/[lng]/candidates`：列出 `WATCHING` 候選（標題 + 觀察理由），從議題分頁可進入，含麵包屑
- [x] 事件頁：顯示累積續報數

### i18n
- [x] 新增憲章相關文案 key（為什麼重要／收錄判準／目前態勢／關鍵行為者／連動脈絡／候選池／休眠／已封存／續報數／候選池頁面文案）中英同步

### 驗證
- [x] `pnpm build` 通過
- [x] 本地以既有資料跑一次遷移腳本，確認收斂後脈絡數落在上限附近、憲章文字合理（見「遷移」）
- [x] 本地手動觸發分流（真實 Gemini 呼叫），確認 mainline/follow-up/candidate/noise 五類行為皆符合預期：兩輪測試共 mainline 16、follow-up 3（含一筆累積 6 次續報並正確觸發 DEVELOPING→VERIFIED 升級）、candidate 7、noise 5；過程中發現並修正一個真實 bug（見下）
- [x] 本地手動觸發編輯會議（真實 Gemini 呼叫），確認生命週期轉換與候選轉正/淘汰符合預期、上限確實被程式邏輯把關；過程中發現並修正一個真實 bug（見下）
- [x] **修正兩個煙霧測試發現的 bug**：(1) 分流模型偶爾漏填 `titleEn`，導致候選被靜默丟棄、mainline 事件英文標題留空——prompt 加強必填提示 + 三處建立邏輯加上 titleZh/titleEn 互為備援；(2) 編輯會議把剛出現幾秒的候選全數判定淘汰——prompt 加強「預設維持觀察，未滿 7 天不因未達轉正門檻而淘汰」。兩者皆重跑同情境驗證修復生效
- [x] Preview 驗證（真實遷移後資料）：候選池頁面（5 筆真實候選）、議題頁憲章區塊（真實憲章內容，「AI 產業發展與巨頭策略」等）皆正確顯示，中文驗證完整，無 console 錯誤

### Sync & Archive
- [ ] delta spec 套回 `openspec/specs/{core-topic,event-clustering,event-research,event-feed-ui}/spec.md`，新建 `openspec/specs/thread-governance/spec.md`
- [ ] `git mv` 至 `openspec/changes/archive/thread-charter/`
- [ ] 開 PR
