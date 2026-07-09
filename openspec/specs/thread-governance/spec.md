## Requirements

### Requirement: 脈絡生命週期狀態機

脈絡 SHALL 具備三種生命週期狀態：`ACTIVE`、`DORMANT`、`ARCHIVED`。`ACTIVE` 脈絡超過可設定天數（預設 14 天）無活動 SHALL 轉為 `DORMANT`；`DORMANT` 脈絡超過可設定天數（預設 60 天）無活動，或經編輯會議判定已有明確終局，SHALL 轉為 `ARCHIVED`。`DORMANT` 脈絡收到新的 mainline 事件或續報時，系統 SHALL 立即將其轉回 `ACTIVE`，SHALL NOT 需要人工或額外 AI 判斷介入此復活轉換。`ARCHIVED` 脈絡 SHALL 視為完全凍結，SHALL NOT 再被分流、續報或收斂比對命中。

#### Scenario: 長期無活動轉為休眠

- **WHEN** 一個 `ACTIVE` 脈絡的最後活動時間超過休眠天數門檻
- **THEN** 系統 SHALL 將其生命週期轉為 `DORMANT`

#### Scenario: 休眠脈絡自動復活

- **WHEN** 一個 `DORMANT` 脈絡的既有事件收到續報，或有新的 mainline 事件掛入
- **THEN** 系統 SHALL 立即將其生命週期轉回 `ACTIVE`

#### Scenario: 已封存脈絡不被喚醒

- **WHEN** 有新文章的內容與某個 `ARCHIVED` 脈絡相關
- **THEN** 系統 SHALL NOT 將該脈絡轉回 `ACTIVE` 或關聯新事件，SHALL 依一般分流規則將其視為候選或建立新脈絡評估

### Requirement: 在用脈絡數量上限

系統 SHALL 限制同時處於 `ACTIVE` 狀態的脈絡數量不超過可設定上限（預設 12）。當有新脈絡建立或候選轉正將導致超過上限時，系統 SHALL 以程式邏輯（非 AI 判斷）強制將活動時間最舊的 `ACTIVE` 脈絡轉為 `DORMANT`，直到符合上限。

#### Scenario: 轉正候選導致超過上限

- **WHEN** 編輯會議建議轉正的候選數量會使 `ACTIVE` 脈絡總數超過上限
- **THEN** 系統 SHALL 優先保留證據強度較高的轉正案，其餘候選 SHALL 保留於候選池待下一輪評估

#### Scenario: 快門建立導致超過上限

- **WHEN** 分流階段以快門建立新脈絡後，`ACTIVE` 脈絡總數超過上限
- **THEN** 下一次編輯會議執行時 SHALL 強制將活動時間最舊的 `ACTIVE` 脈絡轉為 `DORMANT`，直到符合上限

### Requirement: 候選池

系統 SHALL 維護一份候選脈絡觀察名單，每個候選項目 SHALL 記錄標題、觀察理由（讀者可見）、首次/最近偵測時間、累積提及次數與狀態（`WATCHING`/`PROMOTED`/`DISMISSED`）。候選項目 SHALL 對讀者可見。候選項目在未被明確轉正或淘汰前 SHALL 維持 `WATCHING`，系統 SHALL NOT 僅因尚未達轉正門檻就將其淘汰。

#### Scenario: 新訊號寫入候選池

- **WHEN** 分流判定一叢集文章屬於候選（不符合任何既有脈絡但具潛在重要性）
- **THEN** 系統 SHALL 建立或更新對應的候選項目，SHALL 遞增其提及次數並更新最近偵測時間

#### Scenario: 讀者檢視觀察名單

- **WHEN** 讀者查看候選池頁面
- **THEN** 系統 SHALL 顯示所有 `WATCHING` 狀態的候選項目與各自的觀察理由

### Requirement: 脈絡建立兩道門檻

系統 SHALL 提供兩種脈絡建立路徑：**快門**（分流當下判定重要性訊號一致指向重大事件，立即建立脈絡與首個事件，不經候選池累積）與**慢門**（候選池項目累積多日、多來源訊號後，經每日編輯會議判定轉正）。兩種路徑建立的脈絡 SHALL 皆具備完整憲章（為什麼重要、收錄判準、關鍵行為者、初始滾動摘要）。

#### Scenario: 快門建立

- **WHEN** 分流判定一叢集文章不屬於任何既有脈絡，但重要性訊號（規模/不可逆性、意外性、跨脈絡外溢、行為者層級）明顯指向重大事件
- **THEN** 系統 SHALL 在同一次分流呼叫中起草憲章並建立新脈絡與首個事件，SHALL NOT 等待候選池累積

#### Scenario: 慢門轉正

- **WHEN** 編輯會議判定某候選項目已累積足夠的多日、多來源訊號
- **THEN** 系統 SHALL 為其起草憲章、建立新脈絡（`lifecycle=ACTIVE`）並將候選狀態轉為 `PROMOTED`

### Requirement: 每日編輯會議

系統 SHALL 每日執行一次編輯會議程序，審視所有 `ACTIVE` 與 `DORMANT` 脈絡的生命週期狀態，以及候選池中 `WATCHING` 項目的轉正/淘汰判斷。編輯會議呼叫次數 SHALL 為固定頻率（每日一次），SHALL NOT 隨文章擷取量或脈絡數量增加而增加呼叫次數。

#### Scenario: 每日執行一次

- **WHEN** 每日排程觸發編輯會議
- **THEN** 系統 SHALL 以單次 AI 呼叫產出衰退建議、候選轉正建議與候選淘汰建議，SHALL NOT 對個別脈絡或候選逐一呼叫 AI

### Requirement: 每日成本熔斷

系統 SHALL 追蹤每日 AI 呼叫累積成本，超過可設定的每日預算上限（預設 3 美元）時，SHALL 跳過當日剩餘的完整研究、輕量研究、編輯會議與脈絡收斂呼叫，並於隔日重試；分流呼叫 SHALL NOT 受此熔斷影響。

#### Scenario: 當日成本超過預算

- **WHEN** 當日累積 AI 成本超過每日預算上限
- **THEN** 系統 SHALL 跳過後續非分流類的 AI 呼叫，待處理項目 SHALL 保留狀態至隔日重試
