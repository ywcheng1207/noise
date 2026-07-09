## MODIFIED Requirements

### Requirement: 議題整體狀態

系統 SHALL 為核心議題（脈絡）彙整整體狀態：整體可靠度、活躍度（事件數/來源數）、時間跨度（起訖）、真實語系數量統計，並 SHALL 額外承載一份脈絡憲章（為什麼重要、收錄判準、關鍵行為者、目前態勢滾動摘要）與生命週期狀態（`ACTIVE`/`DORMANT`/`ARCHIVED`）。收錄判準與目前態勢摘要 SHALL 對讀者可見。

#### Scenario: 呈現議題摘要

- **WHEN** 讀者在總覽看到某核心議題
- **THEN** 該 topic SHALL 顯示整體可靠度、事件數、來源數、真實語系數量與時間跨度

#### Scenario: 呈現脈絡憲章

- **WHEN** 讀者查看某脈絡的議題頁
- **THEN** 系統 SHALL 顯示該脈絡「為什麼重要」與「收錄判準」的說明文字，以及目前態勢滾動摘要

## ADDED Requirements

### Requirement: 重複脈絡收斂範圍限縮

系統 SHALL 僅對 `ACTIVE` 與 `DORMANT` 狀態的脈絡執行重複脈絡收斂比對，SHALL NOT 將 `ARCHIVED` 脈絡納入比對範圍。

#### Scenario: 已封存脈絡不納入收斂比對

- **WHEN** 系統執行重複脈絡收斂
- **THEN** 比對清單 SHALL 僅包含 `ACTIVE` 與 `DORMANT` 脈絡，`ARCHIVED` 脈絡 SHALL 不出現在比對清單中

### Requirement: 脈絡間連動關係

系統 SHALL 支援脈絡之間建立連動關係，並為每個連動關係附上一句話說明連動原因；連動關係 SHALL 對讀者可見。

#### Scenario: 顯示連動脈絡

- **WHEN** 讀者查看某脈絡的議題頁，且該脈絡與其他脈絡有已建立的連動關係
- **THEN** 系統 SHALL 顯示所連動的脈絡與連動原因，並可點擊前往該脈絡
