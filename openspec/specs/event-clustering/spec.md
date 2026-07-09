## Requirements

### Requirement: 文章分群為事件

系統 SHALL 將擷取到的種子文章分流為以下五類之一：**mainline_existing**（符合既有脈絡收錄判準的新事件）、**mainline_fastgate**（不屬於既有脈絡但重要性達快門標準的新脈絡首個事件）、**follow_up**（既有 `OPEN` 事件的續報）、**candidate**（不屬於任何既有脈絡但具潛在重要性訊號）、**noise**（不收錄）。僅 mainline_existing 與 mainline_fastgate 分類 SHALL 建立新 `Event`；follow_up SHALL 關聯至既有事件而不建立新 Event；candidate SHALL 寫入候選池而不建立 Event；noise SHALL 不建立任何記錄。

#### Scenario: 符合既有脈絡判準的新事件

- **WHEN** 一叢集文章描述的具體事件符合某 `ACTIVE` 或 `DORMANT` 脈絡的收錄判準，且不是該脈絡任何既有 `OPEN` 事件的延續
- **THEN** 系統 SHALL 建立新 `Event`，`topicId` SHALL 直接寫入該脈絡，SHALL 依重要性標記 `PENDING_RESEARCH` 或 `CANDIDATE` 狀態

#### Scenario: 續報既有事件

- **WHEN** 一叢集文章明顯是對某個既有 `OPEN` 事件的補充報導
- **THEN** 系統 SHALL 將文章關聯至該既有 `Event`、SHALL 遞增其 `corroborationCount`，SHALL NOT 建立新 Event

#### Scenario: 不屬於任何既有脈絡

- **WHEN** 一叢集文章不符合任何既有脈絡的收錄判準
- **THEN** 系統 SHALL 依重要性訊號評估是否符合快門或慢門（見 `thread-governance` 能力的「脈絡建立兩道門檻」），皆不符合則標記為 noise 或寫入候選池

#### Scenario: 跨語系分群

- **WHEN** 同一事件同時有中文與英文報導
- **THEN** 系統 SHALL 將不同語系但同主題的文章歸入同一 event

### Requirement: 近似重複偵測

系統 SHALL 偵測近似重複（轉載、改寫、同稿多投）的文章，避免事件內容被灌水。

#### Scenario: 標記近似重複

- **WHEN** 兩篇文章內容高度相似
- **THEN** 系統 SHALL 將其中之一標記為近似重複並在事件內折疊呈現

### Requirement: 重點事件優先

系統 SHALL 依「是否符合既有脈絡收錄判準」與四項重要性訊號（規模/不可逆性、意外性、跨脈絡外溢、行為者層級）綜合判斷是否值得建立新事件並進入研究佇列，SHALL NOT 僅依單一數字重要性分數作為唯一判準。

#### Scenario: 訊號不足不建立事件

- **WHEN** 一叢集文章重要性訊號薄弱且不符合任何既有脈絡收錄判準
- **THEN** 系統 SHALL NOT 為其建立 `Event`，SHALL 視情況寫入候選池或標記 noise

### Requirement: 分群成本控制

系統 SHALL 使用低成本模型（目前為 Gemini flash-lite 等級）進行分群與 triage，控制大量種子文章的處理成本。

#### Scenario: 批次分群

- **WHEN** 一個擷取週期累積了一批新文章
- **THEN** 系統 MAY 以批次方式對整批進行分群/triage，而非逐篇即時呼叫

### Requirement: 聚焦網域過濾

系統 SHALL 只為聚焦網域（`POLITICS`、`BIZ`、`INTL`、`TECH`）建立事件；其餘網域的分群結果 SHALL 不建立事件，且其種子文章 SHALL 標記為已跳過，不再重複進入分群。

#### Scenario: 分到離題網域

- **WHEN** 分群結果某群組的網域為 `DISASTER`、`SOCIETY` 或 `OTHER`
- **THEN** 系統 SHALL NOT 建立對應事件，且 SHALL 將該群組文章狀態設為 `SKIPPED`

#### Scenario: 分到聚焦網域

- **WHEN** 分群結果某群組的網域屬於聚焦網域
- **THEN** 系統 SHALL 建立事件，並依重要性門檻決定是否標記 `PENDING_RESEARCH`

### Requirement: 事件直接歸屬脈絡

分流判定為 mainline 的事件，系統 SHALL 在分流當下直接將其 `topicId` 設定為所屬脈絡，SHALL NOT 另外執行一次獨立的 AI 呼叫重新判斷議題歸屬。

#### Scenario: 新事件建立即掛入脈絡

- **WHEN** 系統將一叢集文章分類為 mainline 並建立新 `Event`
- **THEN** 該 `Event` 的 `topicId` SHALL 在同一次分流結果中確定，不需後續額外呼叫
