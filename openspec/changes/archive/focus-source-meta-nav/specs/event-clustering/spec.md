## MODIFIED Requirements

### Requirement: 聚焦網域過濾
系統 SHALL 只為聚焦網域（`POLITICS`、`BIZ`、`INTL`、`TECH`）建立事件；其餘網域的分群結果 SHALL 不建立事件，且其種子文章 SHALL 標記為已跳過，不再重複進入分群。

#### Scenario: 分到離題網域
- **WHEN** 分群結果某群組的網域為 `DISASTER`、`SOCIETY` 或 `OTHER`
- **THEN** 系統 SHALL NOT 建立對應事件，且 SHALL 將該群組文章狀態設為 `SKIPPED`

#### Scenario: 分到聚焦網域
- **WHEN** 分群結果某群組的網域屬於聚焦網域
- **THEN** 系統 SHALL 建立事件，並依重要性門檻決定是否標記 `PENDING_RESEARCH`
