## Requirements

### Requirement: Agentic 跨來源研究

系統 SHALL 對每個待研究事件執行 agentic 研究流程，使用網頁搜尋（Google Search 接地）跨來源（不限語系）蒐集資訊，補充種子文章未涵蓋的脈絡。

#### Scenario: 對事件展開研究

- **WHEN** 一個事件被排入研究佇列
- **THEN** 系統 SHALL 啟動一次 agentic 研究，產出來龍去脈敘事、時間序列與候選來源清單，並將結果寫入該 event

#### Scenario: 研究有界

- **WHEN** 一次事件研究進行中
- **THEN** 系統 SHALL 限制其工具呼叫次數與 token 預算（task budget），達上限即收斂並回傳已蒐集的結果

### Requirement: 來龍去脈敘事

系統 SHALL 為每個事件產出一段中立、可讀的摘要敘事，說明事件背景、目前進展與爭議點。

#### Scenario: 產出敘事

- **WHEN** 事件研究完成
- **THEN** 該 event SHALL 具備一段敘事，且敘事中的關鍵主張 SHALL 對應到至少一個來源引用

### Requirement: 時間序列

系統 SHALL 為每個事件抽取並排序關鍵發展節點，形成時間序列（timeline），每個節點包含時間、事件描述與來源。

#### Scenario: 建立時序

- **WHEN** 事件研究完成
- **THEN** 該 event SHALL 具備一份依時間排序的節點清單，每個節點 SHALL 標註其來源

#### Scenario: 衝突說法並陳

- **WHEN** 不同來源對同一時間點有衝突說法
- **THEN** 系統 SHALL 並陳衝突說法並標註各自來源，而非單方面採信

### Requirement: 事件更新

系統 SHALL 在事件持續發展時，能以新擷取的資訊更新既有事件的敘事與時序，而非建立重複事件。

#### Scenario: 既有事件追加進展

- **WHEN** 一個已研究的事件出現新進展報導
- **THEN** 系統 SHALL 更新該 event 的時序與敘事並記錄更新時間

### Requirement: 來源後設資訊

研究階段 SHALL 為每個來源標註其**語言**與**媒體型態**（影片或文字），並儲存於該來源紀錄；事件頁 SHALL 以視覺徽章呈現，幫助讀者判斷來源屬性。

#### Scenario: 標註來源語言與型態

- **WHEN** 系統研究某事件並產出來源清單
- **THEN** 每個來源 SHALL 帶有 `language`（語言代碼）與 `mediaType`（`VIDEO` 或 `TEXT`）

#### Scenario: 型態無法判定

- **WHEN** 來源型態無法明確判定
- **THEN** 系統 SHALL 預設為 `TEXT`

### Requirement: 來源網址存活驗證

系統 SHALL 在寫入時間序列節點或來源紀錄前，驗證其外部網址仍可正常存取；確認失效的網址 SHALL 換成研究過程中真正查證過、來自 Google Search 接地結果的同網域網址，皆無可靠替代則 SHALL 不儲存該網址，避免讀者點擊到失效頁面。

#### Scenario: 確認失效網址

- **WHEN** 一個候選來源網址回應 404、410、5xx，或 DNS/連線失敗
- **THEN** 系統 SHALL 判定該網址失效，SHALL NOT 直接寫入資料庫

#### Scenario: 換成接地驗證過的網址

- **WHEN** 一個失效網址與某個 Google Search 接地結果同網域
- **THEN** 系統 SHALL 優先採用該接地結果實際指向的最終網址取代之

#### Scenario: 被擋不視為失效

- **WHEN** 一個候選來源網址回應 403 或 429
- **THEN** 系統 SHALL NOT 僅憑此判定該網址失效（可能為阻擋自動化工具而非頁面不存在），SHALL 保留原網址
