## ADDED Requirements

### Requirement: 候選池可瀏覽

系統 SHALL 在議題分頁內提供候選池的瀏覽入口，讓讀者能檢視目前「觀察中」但尚未成為正式脈絡的候選項目。

#### Scenario: 從議題分頁前往候選池

- **WHEN** 讀者在議題分頁尋找候選池
- **THEN** 系統 SHALL 提供明確可點擊的入口進入候選池列表，列表 SHALL 顯示每個候選的標題與觀察理由

### Requirement: 休眠與封存脈絡的視覺區隔

議題總覽與議題頁 SHALL 以視覺標記區分脈絡的生命週期狀態（`ACTIVE`/`DORMANT`/`ARCHIVED`），避免讀者將休眠或已封存的脈絡誤認為持續活躍。預設篩選 SHALL 僅顯示 `ACTIVE` 與 `DORMANT` 脈絡，`ARCHIVED` 脈絡 SHALL 需額外操作才會顯示。

#### Scenario: 總覽區分脈絡狀態

- **WHEN** 讀者瀏覽議題總覽，其中包含 `DORMANT` 狀態的脈絡
- **THEN** 該脈絡卡片 SHALL 顯示可辨識的休眠標記，與 `ACTIVE` 脈絡有視覺差異

#### Scenario: 預設不顯示已封存脈絡

- **WHEN** 讀者未主動篩選，瀏覽議題總覽
- **THEN** 系統 SHALL NOT 顯示 `ARCHIVED` 狀態的脈絡；讀者 SHALL 能透過篩選主動顯示已封存脈絡

### Requirement: 事件時間軸顯示續報

事件頁的時間序列 SHALL 呈現該事件累積的續報數量，讓讀者理解一則已凍結的事件之後仍持續被多少獨立報導佐證。

#### Scenario: 檢視已凍結事件的續報數

- **WHEN** 讀者查看一個已完成研究（含輕量研究）的事件
- **THEN** 事件頁 SHALL 顯示其累積續報數，若續報曾使可信度標記升級，SHALL 呈現目前的可信度標記
