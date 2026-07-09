## 名詞定義

| 名詞 | 對應 | 定義 |
|------|------|------|
| 脈絡 | `Topic`（既有 model 擴充，不新增 table） | 一條值得持續追蹤的故事線，帶一份「憲章」說明為什麼重要、收錄範圍到哪、現在追到哪 |
| 事件 | `Event`（既有 model 擴充） | 脈絡底下的一次具體研究單位，最多研究兩次（1 完整 + 1 輕量）後凍結 |
| 續報 | 不是新 model，是 `Event.corroborationCount` 遞增 + 一筆 `Article` 關聯 | 對已 `OPEN` 事件的零成本補強：不觸發新研究，可能累積到門檻後升級可信度或觸發唯一一次輕量研究 |
| 候選 | 新 model `ThreadCandidate` | 夠不上任何既有脈絡、但有潛在重要性訊號的觀察對象；讀者可見，累積到門檻才「轉正」成脈絡 |

## 憲章結構

`Topic` 新增六個語意欄位（皆 additive、皆可為 null 以相容既有資料）：

- **為什麼重要**（`charterWhyZh/En`）：一段話說明這條故事線對世界的意義
- **收錄判準**（`charterCriteriaZh/En`）：什麼樣的新發展算「屬於這條脈絡」——**讀者可見**，是回應「不是所有美國新政策都該上」的核心機制。例如「美中地緣政治」脈絡的判準可能是「涉及關稅/出口管制/台海周邊軍事動態/雙方元首層級表態，不含例行外交辭令或非涉外的內政新聞」
- **關鍵行為者**（`charterActorsZh/En`，字串陣列）：這條脈絡的主要行為者（國家/機構/人物），供分流時比對相關性
- **目前態勢**（`digestZh/En`）：2–3 句滾動摘要，取代讀者原本要自己拼湊「這個議題現在演變到哪」

憲章由 AI 在脈絡建立當下起草（見「兩道門檻」），之後**只在事件研究/續報完成時順帶增量更新**（見下），不另外花錢重寫。

「連動脈絡」不做成文字欄位，做成關聯表 `TopicLink`（`fromTopicId`、`toTopicId`、`noteZh/En`）——連動關係是結構化的（兩條脈絡互指），配一句話說明為什麼連動（如「中東戰爭 → 全球通膨：戰事牽動原油價格」），讀者可見於議題頁側欄。

## 重要性怎麼判斷（分流用）

分流呼叫對每個新叢集，相對於「現有脈絡清單（含收錄判準）」評估四個問題，而非套用單一數字門檻：

1. **規模/不可逆性**：影響範圍多廣、後果多難逆轉（例：央行升息 vs. 官員一句口頭評論）
2. **意外性**：跟既有預期/態勢的落差多大（例：市場預期外的結果 vs. 例行公告）
3. **跨脈絡外溢**：會不會牽動其他已追蹤脈絡（例：中東戰事 → 能源價格脈絡）
4. **行為者層級**：發言/行動主體的層級（國家元首/央行 vs. 地方官員/企業發言人）

四個問題的答案不是分別打分加總，而是交給 Gemini 在單次分流呼叫中連同「是否符合某既有脈絡收錄判準」一起綜合判斷，直接輸出分類結果（見下），理由寫進候選池條目或事件的內部備註供之後稽核。

## 分流：取代「分群」

`cluster.ts` 的 `runCluster()` 改造為「分流」，輸入除了新文章清單，**新增現有 ACTIVE 脈絡的憲章摘要（為什麼重要 + 收錄判準 + 關鍵行為者）與各脈絡目前 `OPEN` 的事件標題**（每脈絡至多帶最近 5 個 OPEN 事件標題，避免 ACTIVE 脈絡數量上升時 prompt 隨之線性膨脹過快）。對每個叢集，分流輸出以下四類之一：

| 分類 | 判斷 | 動作 | AI 研究成本 |
|------|------|------|------|
| **mainline（既有脈絡）** | 符合某脈絡收錄判準，且是一則新的具體事件（非既有 OPEN 事件的重複） | 建立新 `Event`，`topicId` 直接寫入該脈絡（不再需要 `topics.ts` 另一次歸類呼叫），標記 `PENDING_RESEARCH` | 觸發一次完整研究 |
| **follow-up（續報）** | 明顯是對某個既有 `OPEN` 事件的補充報導 | 文章關聯到該既有 `Event`，`corroborationCount += 1`，不建立新 Event | 零（見下方續報機制） |
| **mainline（快門新脈絡）** | 不符合任何既有脈絡，但四個重要性問題明顯地一致指向「這是重大的、值得立刻獨立追蹤」 | 同一次呼叫直接起草該新脈絡的憲章（為什麼重要/收錄判準/關鍵行為者）+ 建立 `Topic`（`lifecycle=ACTIVE`）+ 建立首個 `Event` | 觸發一次完整研究 |
| **candidate（慢門候選）** | 不符合任何既有脈絡，重要性訊號不到快門標準但也非顯然無關緊要 | upsert 進 `ThreadCandidate`（依標題相似度去重，命中則 `mentionCount += 1`、更新 `lastSpottedAt`），不建立 Event | 零 |
| **noise（雜訊）** | 以上皆非 | 文章標記 `SKIPPED`（沿用既有離題網域的處理方式） | 零 |

`topics.ts` 的 `assignEventToTopic()`（原本每個新事件都要再花一次 Gemini 呼叫決定歸屬哪個議題）**整併進分流呼叫、不再是獨立步驟**——分流本來就要判斷「這屬於哪個既有脈絡」，沒有理由拆成兩次呼叫。`refreshTopicStats()`（純 DB 聚合、無 AI 成本）維持不變，在事件建立/續報/研究完成後照舊呼叫。

## 事件研究上限與續報機制

- 一個 `Event` 一生最多兩次 AI 研究：`researchEvent()`（完整，現況）與新增的 `refreshEvent()`（輕量）。兩次都完成後，`refreshedAt` 非空即代表凍結，之後永遠不再觸發研究。
- 續報累積：`corroborationCount` 達 3（`REFRESH_THRESHOLD`）且事件仍 `OPEN` 且尚未 `refreshedAt` → 排入輕量研究佇列，由 `refreshEvent()` 處理。`refreshEvent()` 的 prompt 帶入既有 narrative/timeline/sources 與續報以來的新種子文章，只要求「增量更新」（新的時序節點、視需要調整的敘事、新增來源），仍用 Google Search 接地驗證新增的來源網址，但不重新驗證背景——prompt 與輸出都比完整研究小很多。
- 不經 AI 的可信度升級：`corroborationCount` 從 0→1 且目前為 `UNVERIFIED` → 升級 `DEVELOPING`；達 `REFRESH_THRESHOLD`（獨立來源）且目前為 `DEVELOPING` → 升級 `VERIFIED`。這是純函式（比對次數與既有 tier），不是 AI 判斷，因為「有 N 個獨立來源佐證」是可以直接算出來、不需要模型重新評估的客觀事實。
- 事件關閉：`OPEN` 事件超過 72 小時（`FOLLOW_UP_WINDOW_HOURS`）沒有新續報 → `CLOSED`，`closedAt` 寫入。`CLOSED` 事件仍可被續報（例如舊事件被重新提起），續報邏輯不因 `CLOSED` 而拒絕，但會重新打開（`CLOSED → OPEN`，`closedAt` 清空）而非視為新事件。

## 脈絡滾動摘要：零額外呼叫

`researchEvent()` 與 `refreshEvent()` 的 JSON 回應 schema 新增一個欄位：`topicDigestZh/En`（2–3 句）。Prompt 帶入該事件目前所屬脈絡的**現有** `digestZh/En` 當上下文，要求模型「基於這則事件的研究結果，順便給出這條脈絡目前態勢的最新兩三句摘要」——這是同一次呼叫多輸出一個欄位，不是新增呼叫。寫回 `Topic.digestZh/En` 與 `lastActivityAt`（後者也用於生命週期判斷，見下）。

## 生命週期狀態機

**事件**：`OPEN` ⇄ `CLOSED`（見上）。

**脈絡**：`ACTIVE` → `DORMANT`（`lastActivityAt` 超過 14 天）→ `ARCHIVED`（`lastActivityAt` 超過 60 天，或編輯會議判定已有明確終局如停火/選舉結果確定）。`DORMANT` 脈絡若有新事件（mainline）或續報掛入，**分流階段就直接把 `lifecycle` 寫回 `ACTIVE`**（純規則、不需編輯會議介入）——復活是自動的，只有「衰退」（ACTIVE→DORMANT→ARCHIVED）與「候選轉正」需要判斷力，交給編輯會議。`ARCHIVED` 脈絡完全凍結：不再被分流比對、不再被收斂比對、事件不再被續報比對命中（即使有新文章談到同個話題，分流找不到匹配的 ACTIVE 脈絡，會落入 candidate 候選池重新評估，而不是喚醒一個已封存的舊脈絡）。

## 兩道門檻：脈絡怎麼誕生

- **慢門**：候選池條目累積到「多日、多獨立來源持續出現」（非單一數字門檻，由編輯會議綜合 `mentionCount`、`firstSpottedAt` 到 `lastSpottedAt` 的跨度、來源多樣性判斷）→ 編輯會議把它「轉正」：起草憲章、建立 `Topic`（`lifecycle=ACTIVE`）、建立首個 `Event`（用候選池累積的種子文章跑第一次完整研究）。
- **快門**：分流呼叫當下就判定重要性四問一致指向「重大」，不必等候選池累積，直接建立新脈絡（見分流表格「mainline（快門新脈絡）」）。快門是分流步驟的一部分，不是編輯會議的職責——重大事件不能等到隔天的編輯會議才成立脈絡。

## 候選池

新 model `ThreadCandidate`：`titleZh/En`、`signalZh/En`（為什麼值得關注，一句話，讀者可見）、`domain`、`regions`、`mentionCount`、`firstSpottedAt`、`lastSpottedAt`、`status`（`WATCHING`/`PROMOTED`/`DISMISSED`）、`promotedTopicId`（轉正後回指）。前端議題總覽新增「觀察中」區塊呈現 `WATCHING` 的候選（見 `event-feed-ui` delta），讓「為什麼這個還不是議題」本身也透明可查。編輯會議判定候選訊號已消退（`lastSpottedAt` 停滯超過一段時間、`mentionCount` 未再成長）→ `DISMISSED`，不再顯示。

## 每日編輯會議：唯一的新排程呼叫

新增 `runEditorialMeeting()`，由新的 cron `api/cron/editorial` 每日觸發一次。輸入：所有 `ACTIVE` 脈絡（憲章摘要 + `lastActivityAt` + `eventCount`）、所有 `DORMANT` 脈絡（同上 + `dormantAt`）、所有 `WATCHING` 候選。輸出：

1. **衰退名單**：建議轉 `DORMANT` 的 ACTIVE 脈絡、建議轉 `ARCHIVED` 的 DORMANT 脈絡（含判定「已有明確終局」的個案，即使未滿 60 天）
2. **候選轉正名單**：建議轉正的候選（附起草的憲章）
3. **候選淘汰名單**：建議 `DISMISSED` 的候選

**上限執行是程式邏輯、不是模型職責**：模型輸出轉正建議後，程式碼檢查「目前 ACTIVE 數 − 本輪衰退數 + 本輪轉正數」是否超過 `ACTIVE_THREAD_CAP`(12)；若超過，優先保留證據強度高（`mentionCount`/來源多樣性）的轉正案，其餘退回候選池等下一輪；同時，即使沒有新候選要轉正，若目前 ACTIVE 數已超過上限（如剛發生多起快門建立），也會在本輪強制把 `lastActivityAt` 最舊的 ACTIVE 脈絡壓到 `DORMANT`，直到符合上限。這樣「AI 建議、程式把關硬限制」分工明確，上限不會因為模型沒完全遵守數字指令而失守。

`consolidateTopics()`（既有的重複脈絡合併）沿用現況實作，只加一個過濾條件：只比對 `ACTIVE` + `DORMANT` 脈絡，`ARCHIVED` 不再進入比對清單，避免比對成本隨脈絡總數（含歷史封存）無限增長。

## 每日成本熔斷

沿用既有 `AiRun.costUsd` 記錄，新增 `DAILY_BUDGET_USD = 3` 檢查：每次要觸發「完整研究」「輕量研究」「編輯會議」「收斂」前，先查當日（UTC）`AiRun` 成本總和，超過預算即跳過該次呼叫（分流本身不受此限——分流是分類判斷、不能因為預算就停止讀懂新文章，且分流本身呼叫成本低）。超支的研究/收斂/編輯會議工作留到隔日重試，不會遺失（`PENDING_RESEARCH`/`WATCHING`/`OPEN` 狀態本來就是可重入的）。

## 調校參數（可調，先給預設值）

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `FOLLOW_UP_WINDOW_HOURS` | 72 | 事件多久沒續報就轉 `CLOSED` |
| `REFRESH_THRESHOLD` | 3 | 續報數達此值觸發輕量研究 + 可信度升級檢查 |
| `TOPIC_DORMANT_DAYS` | 14 | 脈絡多久無活動轉 `DORMANT` |
| `TOPIC_ARCHIVE_DAYS` | 60 | 脈絡多久無活動轉 `ARCHIVED`（兩者皆以 `lastActivityAt` 為基準，非疊加） |
| `ACTIVE_THREAD_CAP` | 12 | 同時 `ACTIVE` 的脈絡數上限 |
| `DAILY_BUDGET_USD` | 3 | 每日 AI 成本熔斷 |

皆以常數集中定義（比照 `lib/gemini.ts` 的 `MODEL`/`PRICING` 寫法），方便日後依實際數據調整，不需要改動邏輯本身。

## Schema 設計

```prisma
enum TopicLifecycle {
  ACTIVE
  DORMANT
  ARCHIVED
}

enum CandidateStatus {
  WATCHING
  PROMOTED
  DISMISSED
}

model Topic {
  // ...既有欄位不變
  lifecycle         TopicLifecycle @default(ACTIVE)
  charterWhyZh      String?
  charterWhyEn      String?
  charterCriteriaZh String?
  charterCriteriaEn String?
  charterActorsZh   String[]       @default([])
  charterActorsEn   String[]       @default([])
  digestZh          String?
  digestEn          String?
  lastActivityAt    DateTime?
  dormantAt         DateTime?
  archivedAt         DateTime?
  linksFrom          TopicLink[]    @relation("LinkFrom")
  linksTo            TopicLink[]    @relation("LinkTo")
  candidates          ThreadCandidate[]

  @@index([lifecycle])
}

model TopicLink {
  id           String   @id @default(uuid()) @db.Uuid
  fromTopicId  String   @db.Uuid
  fromTopic    Topic    @relation("LinkFrom", fields: [fromTopicId], references: [id], onDelete: Cascade)
  toTopicId    String   @db.Uuid
  toTopic      Topic    @relation("LinkTo", fields: [toTopicId], references: [id], onDelete: Cascade)
  noteZh       String?
  noteEn       String?
  createdAt    DateTime @default(now())

  @@unique([fromTopicId, toTopicId])
}

model ThreadCandidate {
  id             String           @id @default(uuid()) @db.Uuid
  titleZh        String
  titleEn        String
  signalZh       String?
  signalEn       String?
  domain         Domain           @default(OTHER)
  regions        Region[]         @default([])
  mentionCount   Int              @default(1)
  firstSpottedAt DateTime         @default(now())
  lastSpottedAt  DateTime         @default(now())
  status         CandidateStatus  @default(WATCHING)
  promotedTopicId String?         @db.Uuid
  promotedTopic   Topic?          @relation(fields: [promotedTopicId], references: [id])
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([status])
}

model Event {
  // ...既有欄位不變
  closedAt           DateTime?
  corroborationCount  Int       @default(0)
  refreshedAt         DateTime?

  @@index([status, closedAt])
}
```

全部 additive（新欄位皆有預設值或可為 null），`prisma db push` 直接套用，無需資料轉換即可相容既有 38 筆議題與既有事件（它們會落在 `lifecycle=ACTIVE`、憲章欄位為 null 的狀態，由遷移腳本補齊）。

## 遷移：既有 38 議題怎麼變成初始脈絡集合

一次性腳本 `scripts/migrate-thread-charters.ts`（不进入常態管線）：

1. 讀出全部既有 `Topic` + 其 `events`（標題、`lastUpdatedAt`、`eventCount`）
2. 一次 Gemini 呼叫（清單可能較長，用較高 `maxOutputTokens`）：依內容相近程度將 38 筆收斂為預期落在上限附近（12 上下，允許 AI 依實際內容判斷微調）的脈絡集合，對每個收斂後的脈絡起草憲章（為什麼重要/收錄判準/關鍵行為者/初始 `digest`），並依「最後活動時間」建議初始 `lifecycle`（多數應為 `ACTIVE`，明顯久未更新者可直接標 `DORMANT`）
3. 依輸出結果：需要合併的議題沿用 `consolidateTopics()` 既有的「事件轉移 → 刪除重複議題 → 重算統計」機制；保留的議題寫入憲章欄位與 `lifecycle`
4. **不重新研究任何既有事件**——現有 `narrativeZh/En`、`timeline`、`sources` 原樣保留，只是掛到新的脈絡結構下
5. 腳本執行後人工檢視一次收斂結果（不是全自動上線，這是一次性資料遷移，容許人工把關；日後常態的脈絡誕生/衰退才是全自動）

## 排除的做法

- **完全依賴數字重要性分數（單一 0–1 threshold）判斷值不值得成為脈絡**：原本 `IMPORTANCE_THRESHOLD` 就是這種設計，正是使用者指出「流於片面」的作法——單一分數無法表達「跟既有脈絡的關聯」「是否只是續報」這類脈絡性判斷，改用「相對於既有脈絡收錄判準」的比對取代。
- **候選池轉正上限也交給 AI 自我約束**：模型對「不超過 N 個」這類精確計數指令的遵從不可靠，改成 AI 產出建議、程式碼做硬性計數把關。
- **DORMANT 脈絡的復活也走編輯會議判斷**：復活的判準單純（有新活動就復活），不需要模型介入，用分流階段的規則直接處理，把編輯會議的職責收斂在真正需要判斷力的衰退/轉正兩件事上，控制編輯會議呼叫的 prompt 大小與複雜度。
