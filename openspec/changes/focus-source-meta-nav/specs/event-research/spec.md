## MODIFIED Requirements

### Requirement: 來源後設資訊
研究階段 SHALL 為每個來源標註其**語言**與**媒體型態**（影片或文字），並儲存於該來源紀錄；事件頁 SHALL 以視覺徽章呈現，幫助讀者判斷來源屬性。

#### Scenario: 標註來源語言與型態
- **WHEN** 系統研究某事件並產出來源清單
- **THEN** 每個來源 SHALL 帶有 `language`（語言代碼）與 `mediaType`（`VIDEO` 或 `TEXT`）

#### Scenario: 型態無法判定
- **WHEN** 來源型態無法明確判定
- **THEN** 系統 SHALL 預設為 `TEXT`
