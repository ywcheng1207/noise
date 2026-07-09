## Requirements

### Requirement: 定時來源輪詢

系統 SHALL 依可設定的排程（Vercel Cron）輪詢一份可設定的新聞來源清單（RSS feed、News API、或白名單內的輕量爬蟲），擷取新發佈文章的標題與 metadata。

#### Scenario: 排程觸發擷取

- **WHEN** 排程器（Vercel Cron）觸發擷取工作
- **THEN** 系統對每個啟用中的來源抓取最新項目，並將新出現的文章（以正規化 URL 判斷）寫入 `articles` 資料表

#### Scenario: 單一來源失敗不影響其他來源

- **WHEN** 某個來源回應逾時或回傳錯誤
- **THEN** 系統記錄該來源的失敗、跳過該來源並繼續處理其餘來源，且不中斷整體擷取工作

### Requirement: 來源註冊表

系統 SHALL 維護一份可管理的來源註冊表，每個來源包含類型（rss / news_api / crawler）、URL、語系、預設可信度基準與啟用狀態。

#### Scenario: 停用來源

- **WHEN** 管理者將某來源標記為停用
- **THEN** 後續擷取工作 SHALL NOT 再從該來源抓取

### Requirement: 僅儲存 metadata 與摘要片段

系統在擷取階段 SHALL 僅持久化標題、原文 URL、來源、發佈時間與簡短片段（snippet）；文章全文 SHALL 僅在後端暫存供分析，且 SHALL NOT 公開重製（見 `content-compliance`）。

#### Scenario: 擷取後不對外暴露全文

- **WHEN** 一篇文章被擷取且其全文被暫存供分析
- **THEN** 任何讀者可存取的 API 或頁面 SHALL NOT 回傳該文章全文，只回傳標題、片段與原文連結

### Requirement: 擷取去重

系統 SHALL 在寫入前正規化 URL（去除追蹤參數、統一大小寫/結尾）並比對，避免同一文章重複入庫。

#### Scenario: 重複文章不重複入庫

- **WHEN** 同一篇文章在不同輪詢中被重複抓到
- **THEN** 系統 SHALL 辨識其為既有文章並更新時間戳，而非建立重複記錄
