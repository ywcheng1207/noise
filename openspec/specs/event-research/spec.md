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

系統 SHALL 在事件持續發展時以續報機制吸收新資訊，SHALL NOT 對同一事件重複執行超過一次完整研究與一次輕量研究；達研究上限（`refreshedAt` 非空）的事件 SHALL 視為凍結，後續新資訊 SHALL 僅以續報（`corroborationCount` 遞增）吸收，SHALL NOT 觸發任何新的 AI 研究呼叫。

#### Scenario: 既有事件追加進展

- **WHEN** 一個已研究的事件出現新進展報導
- **THEN** 系統 SHALL 更新該 event 的時序與敘事並記錄更新時間

#### Scenario: 已凍結事件收到新報導

- **WHEN** 一個 `refreshedAt` 非空的事件被分流判定收到續報
- **THEN** 系統 SHALL 遞增其 `corroborationCount`，SHALL NOT 觸發研究呼叫，SHALL 依累積續報數評估是否升級可信度標記

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

### Requirement: 事件開放狀態與自動關閉

事件 SHALL 具備 `OPEN`/`CLOSED` 狀態；`OPEN` 事件超過可設定的續報等待期（預設 72 小時）未收到新續報，系統 SHALL 將其轉為 `CLOSED`。`CLOSED` 事件收到新續報時，系統 SHALL 將其重新轉為 `OPEN`，SHALL NOT 視為建立新事件。

#### Scenario: 逾期無續報自動關閉

- **WHEN** 一個 `OPEN` 事件超過續報等待期未收到任何新續報
- **THEN** 系統 SHALL 將其狀態轉為 `CLOSED` 並記錄關閉時間

#### Scenario: 已關閉事件重新有進展

- **WHEN** 一個 `CLOSED` 事件被分流判定收到新續報
- **THEN** 系統 SHALL 將其重新轉為 `OPEN`，SHALL 清除先前的關閉時間，SHALL NOT 建立新的 `Event`

### Requirement: 續報觸發輕量研究

`OPEN` 且尚未執行過輕量研究的事件，累積續報數達可設定門檻（預設 3）時，系統 SHALL 排入輕量研究佇列；輕量研究 SHALL 以既有敘事、時序、來源與續報以來的新種子文章為輸入，僅產出增量更新，SHALL NOT 重新驗證未變動的既有背景資訊。

#### Scenario: 續報累積達門檻

- **WHEN** 一個 `OPEN` 事件的 `corroborationCount` 達輕量研究門檻且 `refreshedAt` 為空
- **THEN** 系統 SHALL 對其執行一次輕量研究，完成後 SHALL 將 `refreshedAt` 設為當下時間

### Requirement: 續報可信度升級不經 AI 判斷

系統 SHALL 依累積續報數以固定規則（不呼叫 AI）評估是否升級事件整體可信度標記：`UNVERIFIED` 有至少一則獨立續報 SHALL 升級為 `DEVELOPING`；`DEVELOPING` 累積續報達輕量研究門檻 SHALL 升級為 `VERIFIED`。

#### Scenario: 首則續報自動升級

- **WHEN** 一個 `overallReliability` 為 `UNVERIFIED` 的事件收到第一則續報
- **THEN** 系統 SHALL 將其 `overallReliability` 升級為 `DEVELOPING`，SHALL NOT 為此升級呼叫 AI

### Requirement: 脈絡滾動摘要隨事件研究更新

系統 SHALL 在完整研究或輕量研究的同一次 AI 呼叫中，一併產出該事件所屬脈絡的最新滾動摘要，SHALL NOT 為更新脈絡摘要另外發起 AI 呼叫。

#### Scenario: 研究完成順帶更新脈絡摘要

- **WHEN** 一個有所屬脈絡的事件完成完整或輕量研究
- **THEN** 該次 AI 回應 SHALL 包含脈絡最新滾動摘要，系統 SHALL 將其寫回所屬 `Topic` 並更新其最後活動時間
