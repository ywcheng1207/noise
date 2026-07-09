## Requirements

### Requirement: 文章分群為事件

系統 SHALL 將擷取到的種子文章分群為獨立的「事件/議題」，使描述同一真實世界事件的文章歸於同一個 `event`。

#### Scenario: 同一事件的多篇報導歸為一群

- **WHEN** 多篇文章（可能來自不同來源、不同語系）描述同一事件
- **THEN** 系統 SHALL 將它們關聯到同一個 event，並為該 event 指定一個正規化標題與主題標籤

#### Scenario: 跨語系分群

- **WHEN** 同一事件同時有中文與英文報導
- **THEN** 系統 SHALL 將不同語系但同主題的文章歸入同一 event

### Requirement: 近似重複偵測

系統 SHALL 偵測近似重複（轉載、改寫、同稿多投）的文章，避免事件內容被灌水。

#### Scenario: 標記近似重複

- **WHEN** 兩篇文章內容高度相似
- **THEN** 系統 SHALL 將其中之一標記為近似重複並在事件內折疊呈現

### Requirement: 重點事件優先

系統 SHALL 依可設定的標準（報導數量、來源多樣性、時間集中度）為事件評定重要性，僅將超過門檻的事件升級進入研究階段，以避免資訊零碎。

#### Scenario: 低重要性叢集不進入研究

- **WHEN** 一個叢集僅有單一來源的單篇報導且未達重要性門檻
- **THEN** 系統 SHALL NOT 為其啟動成本較高的 agentic 研究，並保留於候選池待後續累積

#### Scenario: 重要事件升級

- **WHEN** 一個叢集達到重要性門檻
- **THEN** 系統 SHALL 將該 event 標記為待研究並排入研究佇列

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
