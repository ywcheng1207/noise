## ADDED Requirements

### Requirement: 雙語介面
系統 SHALL 提供中文與英文雙語介面，讀者 SHALL 能切換語言，且介面語言偏好 SHALL 被記住。

#### Scenario: 切換語言
- **WHEN** 讀者切換語言為英文
- **THEN** 介面文字 SHALL 以英文呈現，且事件若有對應語系內容則優先顯示該語系版本

### Requirement: 重點事件 Feed
系統 SHALL 以「重點事件卡片」形式呈現 feed，每張卡片包含事件標題、簡短摘要，以及緊接標題後方的整體可信度標記。

#### Scenario: 瀏覽 feed
- **WHEN** 讀者開啟首頁
- **THEN** 系統 SHALL 依重要性/時間呈現重點事件卡片清單，每張卡片標題後方 SHALL 顯示可信度標記

#### Scenario: 可信度標記可解釋
- **WHEN** 讀者點選卡片上的可信度標記
- **THEN** 系統 SHALL 顯示該事件整體可靠度的簡要說明

### Requirement: 事件檔案詳情頁
系統 SHALL 為每個事件提供詳情頁，包含來龍去脈敘事、時間序列，以及依可信度排名的來源清單（含原文連結）。

#### Scenario: 檢視事件詳情
- **WHEN** 讀者點進某個事件
- **THEN** 系統 SHALL 顯示該事件的敘事、時序與可信度排名來源，每個來源 SHALL 可點擊連回原文

#### Scenario: 官方來源突顯
- **WHEN** 事件包含被標示為官方/權威的來源
- **THEN** 詳情頁 SHALL 在視覺上突顯該來源

### Requirement: 響應式呈現
系統 SHALL 在桌機與行動裝置上皆可正常呈現 feed 與詳情頁。

#### Scenario: 行動裝置瀏覽
- **WHEN** 讀者以手機開啟平台
- **THEN** feed 與詳情頁 SHALL 以適配行動裝置的版面呈現

### Requirement: 焦點總覽與三維度分類
系統 SHALL 提供「焦點總覽」呈現現有核心議題，並支援以 `領域 × 時間區間 × 地區` 三個維度篩選。

#### Scenario: 依時間區間篩選
- **WHEN** 讀者選擇時間區間「進行中」
- **THEN** 總覽 SHALL 只顯示該時間區間狀態的核心議題

#### Scenario: 多維度同時套用
- **WHEN** 讀者同時選擇某領域與某地區
- **THEN** 總覽 SHALL 只顯示同時符合兩者的核心議題

### Requirement: 三層導覽與議題頁擴散呈現
系統 SHALL 提供 焦點總覽 → 核心議題頁 → 事件檔案頁 三層導覽；議題頁 SHALL 以時間軸呈現旗下事件（由核心向外擴散）。

#### Scenario: 逐層進入
- **WHEN** 讀者於總覽點選一個核心議題
- **THEN** 系統 SHALL 進入該議題頁，以時間軸顯示旗下事件；點選事件 SHALL 進入該事件檔案頁

### Requirement: 真實世界地圖與地區高亮
系統 SHALL 以**真實地理邊界**（非幾何示意）的世界地圖輔助呈現地區；當讀者 hover 一個核心議題時，地圖上其相關地區 SHALL 高亮並顯示名稱。

#### Scenario: hover 高亮地區
- **WHEN** 讀者將游標移至某核心議題
- **THEN** 世界地圖 SHALL 高亮該議題的相關地區並顯示地區名稱
