## ADDED Requirements

### Requirement: 不公開重製全文
系統 SHALL NOT 對外公開重製新聞全文；對外呈現 SHALL 僅限標題、平台自製摘要與原文連結。

#### Scenario: 詳情頁只呈現摘要與連結
- **WHEN** 讀者檢視任一事件或來源
- **THEN** 系統 SHALL 僅呈現平台自製摘要與原文連結，SHALL NOT 顯示原文全文

### Requirement: 來源歸屬
系統 SHALL 為每則被引用的資訊提供清楚的來源歸屬與可點擊的原文連結。

#### Scenario: 每個主張可溯源
- **WHEN** 系統呈現一段敘事或時序節點
- **THEN** 其關鍵主張 SHALL 標註來源並可連回原文

### Requirement: 評分免責與意見聲明
系統 SHALL 在呈現可信度評分處標示「此為依公開方法論所作之評估意見」之聲明，並提供方法論說明連結。

#### Scenario: 顯示免責聲明
- **WHEN** 讀者檢視任一可信度評分
- **THEN** 系統 SHALL 一併提供方法論/意見性質之聲明入口

### Requirement: 申訴與更正機制
系統 SHALL 提供管道讓來源方或讀者對特定評分或內容提出更正/申訴，並可記錄處理狀態。

#### Scenario: 提出申訴
- **WHEN** 某來源方對一筆評分提出異議
- **THEN** 系統 SHALL 受理該申訴、記錄並可標記受爭議的評分待覆核

### Requirement: 來源排除與原始內容保存政策
系統 SHALL 遵守來源的排除要求（robots.txt / opt-out / 撤下請求），並對後端暫存之原始內容套用保存期限政策。

#### Scenario: 處理撤下請求
- **WHEN** 來源方要求停止使用其內容
- **THEN** 系統 SHALL 停止擷取該來源並可移除其衍生呈現

#### Scenario: 原始內容過期清除
- **WHEN** 後端暫存之原始全文超過設定保存期限
- **THEN** 系統 SHALL 清除該暫存全文，僅保留 metadata 與自製摘要
