## MODIFIED Requirements

### Requirement: 事件更新

系統 SHALL 在事件持續發展時以續報機制吸收新資訊，SHALL NOT 對同一事件重複執行超過一次完整研究與一次輕量研究；達研究上限（`refreshedAt` 非空）的事件 SHALL 視為凍結，後續新資訊 SHALL 僅以續報（`corroborationCount` 遞增）吸收，SHALL NOT 觸發任何新的 AI 研究呼叫。

#### Scenario: 已凍結事件收到新報導

- **WHEN** 一個 `refreshedAt` 非空的事件被分流判定收到續報
- **THEN** 系統 SHALL 遞增其 `corroborationCount`，SHALL NOT 觸發研究呼叫，SHALL 依累積續報數評估是否升級可信度標記

## ADDED Requirements

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
