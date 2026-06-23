---
name: security-conventions
description: Security conventions for this project — API error masking, account enumeration defense, input validation with Zod, TipTap XSS surface, CSRF, sensitive data handling, and rate limiting. Use when writing API routes, error messages, handling user input or uploads, or reviewing any code touching auth, authorization, or sensitive data.
---

# Security Conventions

所有場景都適用，包含：撰寫 API route、表單、錯誤訊息文案、處理用戶輸入、上傳功能、Code Review。

---

## 1. API 回應安全

### 禁止傳回原始 DB / Prisma 錯誤

原始 Prisma 錯誤會洩露資料庫結構（table name、column name、constraint 名稱），讓攻擊者能推斷 schema 並設計更精準的攻擊。

### 錯誤回應的標準模式

本專案的錯誤回應**只帶 status code、不帶使用者文案**；文案由前端依情境用 `notify` + i18n key 顯示。後端攔截錯誤後只在伺服器端記 log。

```ts
// ❌ 危險：洩露內部結構
catch (error) {
  return NextResponse.json({ error: error.message })
  // 可能吐出：Unique constraint failed on the fields: (`email`)
}

// ❌ 錯誤：在 API 回應硬編碼任何語言的文案（中文、英文都不行）
catch (error) {
  return encryptResponse(StatusCodes.ServerError, sharedSecret, {
    message: '操作失敗，請稍後再試',
  })
}

// ✅ 正確：只記 log、只回 status code
catch (error) {
  console.error('XXX API Error:', error) // 只記錄在伺服器端
  return encryptResponse(StatusCodes.ServerError, sharedSecret)
}
```

前端對應寫法（文案來自 `notify.json`，三語系同步）：

```ts
const mutation = useMutation({
  mutationFn: (data: UpdateUserRequest) => apiFetch('/api/user', { method: 'PUT', body: data }),
  onError: () => notify('error', t('notify:update_fail')),
})
```

### 統一回應格式

成功回應使用 `ApiResponse<T>` 泛型結構（`{ success, data?, error? }`），錯誤回應統一走 `encryptResponse(StatusCodes.X, sharedSecret)`。`StatusCodes` 定義於 `lib/status.ts`。

---

## 2. 錯誤訊息設計（防帳號列舉）

帳號列舉（Account Enumeration）是攻擊者透過不同的錯誤回應判斷帳號是否存在，再針對已知帳號發動攻擊。防禦關鍵：**所有登入相關失敗，回傳完全相同的 status code 與回應結構**，前端顯示同一句 i18n 文案。

### 登入

```ts
// ❌ 危險：讓攻擊者能從回應差異判斷帳號是否存在
if (!user) return encryptResponse(StatusCodes.NotFound, sharedSecret)
if (!passwordMatch) return encryptResponse(StatusCodes.Unauthorized, sharedSecret)

// ✅ 正確：兩種情況回傳完全相同的回應
if (!user || !passwordMatch) {
  return encryptResponse(StatusCodes.Unauthorized, sharedSecret)
}
// 前端統一顯示 t('notify:login_failed')（「Email 或密碼不正確」）
```

### 忘記密碼（`POST /api/auth/reset-password/request`）

```ts
// ❌ 危險：確認帳號存在
if (!user) return encryptResponse(StatusCodes.NotFound, sharedSecret)

// ✅ 正確：無論帳號存在與否，回傳相同的成功回應
// 前端顯示 t('notify:reset_email_sent')（「若此 Email 已註冊，您將收到重設密碼的信件」）
return encryptResponse(StatusCodes.Success, sharedSecret)
```

### 帳號鎖定 / 頻率限制

不透露剩餘次數與鎖定時間。回 `StatusCodes.TooManyRequests`（429）＋ `Retry-After` header 即可，前端顯示通用的「請稍後再試」文案。

### 驗證錯誤文案

i18n 文案中不暴露密碼規則的正則內容、欄位長度的資料庫來源（如「此欄位資料庫限制 255 字元」）。

```
❌ '密碼格式需符合 /^(?=.*[A-Z])(?=.*\d).{8,}$/'
✅ '密碼需至少 8 個字元，包含大寫字母與數字'
```

---

## 3. 輸入驗證

### 後端驗證是真正的防線

前端驗證只是 UX（使用者可輕易繞過），後端才是實際防線。**兩者都要做，但後端不可省略**。

```ts
// ❌ 危險：直接信任輸入
const { name, email } = data
await prisma.user.create({ data: { name, email } })

// ✅ 正確：過 Zod 驗證後才使用
const result = createUserSchema.safeParse(data)
if (!result.success) return encryptResponse(StatusCodes.BadRequest, sharedSecret)
const { name, email } = result.data // 強型別，已驗證
```

### URL Query Params

URL 參數永遠是字串，不可信任其型別，必須明確轉換與驗證。

```ts
// ❌ 危險：直接當數字用
const page = searchParams.get('page') // 實際是 string，可能是 "abc"

// ✅ 正確：轉換並驗證
const pageParam = Number(searchParams.get('page'))
const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1
```

### 檔案上傳

`Content-Type` header 由客戶端自行設定，可偽造。必須同時驗證 MIME type 與副檔名，並在伺服器端做二次確認。

```ts
const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4']
const allowedExts = ['.jpg', '.jpeg', '.png', '.mp4']
if (!allowedTypes.includes(file.type) || !allowedExts.some(ext => file.name.endsWith(ext))) {
  return encryptResponse(StatusCodes.BadRequest, sharedSecret)
}
```

---

## 4. XSS 防護

### 本專案的富文字渲染（TipTap）

專案的富文字（訓練筆記）以 **TipTap JSON** 儲存，渲染時用 `generateHTML(json, extensions)` 從結構化 JSON 產生 HTML——輸出受 extension 白名單約束，不是 raw HTML 注入。安全規則：

- `generateHTML` 的 extension 清單必須固定且最小化，**禁止**加入允許 raw HTML 的 extension
- 使用 `Link` extension 時必須限制 protocol（只允許 `http` / `https`），防止 `javascript:` URL
- **禁止**把使用者輸入直接當 HTML 字串塞進 `dangerouslySetInnerHTML`——只能傳入 `generateHTML` 的輸出
- 若未來需要渲染來源不受控的 raw HTML（如外部 API 的內容），必須先安裝並通過 DOMPurify 消毒（目前專案未安裝，也沒有此場景）

```tsx
// ✅ 本專案唯一允許的 dangerouslySetInnerHTML 用法
<div dangerouslySetInnerHTML={{ __html: generateHTML(tipTapJson, FIXED_EXTENSIONS) }} />

// ❌ 永遠禁止：raw 字串直接注入
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

### 動態屬性注入

```tsx
// ❌ 危險：user input 直接進 href（可輸入 javascript:alert(document.cookie)）
<a href={userInput}>連結</a>

// ✅ 正確：驗證協定
const safeHref = userInput.startsWith('http') ? userInput : '#'
```

### 圖片來源

使用 `next/image` 並在 `next.config.mjs` 設定 domains 白名單，禁止無限制的 `<img src={userProvidedUrl}>`。

---

## 5. CSRF 防護

### 本專案現有防護

`apiHandler` wrapper 使用加密 payload，已提供一層防護——惡意網站無法產生有效的加密請求。

### 額外原則

**State-changing 操作禁止接受 GET 請求**，因為 GET 會被瀏覽器、爬蟲、CDN 快取，且可透過 `<img src>` 等標籤靜默觸發。同理，**禁止用 `handleGetRequest` 包裝會改變狀態的 POST handler**——wrapper 與 HTTP 語意必須一致。

**iframe 嵌入防護**：已透過 CSP header 設定 `frame-ancestors 'none'`。

---

## 6. 敏感資料處理

### 禁止記錄敏感資訊到 Log

Log 常會被收集到第三方服務，token 一旦進入 log 等同公開。

```ts
// ❌ 危險
console.log('User token:', accessToken)
console.log('Request data:', JSON.stringify(data)) // 可能含密碼

// ✅ 正確：只記錄非敏感的診斷資訊
console.error('Login attempt failed for userId:', userId)
```

### 禁止在 API Response 回傳敏感欄位

```ts
// ❌ 危險：回傳完整 user（含 password_hash）
const user = await prisma.user.findUnique({ where: { id } })
return encryptResponse(StatusCodes.Success, sharedSecret, user)

// ✅ 正確：用 select 只取需要的欄位
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, display_name: true },
})
```

### Token 儲存位置

| 儲存方式 | 安全性 | 建議 |
|----------|--------|------|
| `httpOnly` Cookie | 高，JS 無法讀取 | Token 首選 |
| `localStorage` | 低，XSS 可竊取 | 只存非敏感 UI 狀態 |
| React state / Redux | 中，頁面關閉即清除 | 短暫操作可接受 |

### 環境變數前綴

`NEXT_PUBLIC_` 前綴會將變數打包進前端 bundle，任何人都能讀取。機敏資料（`SIGNING_PRIVKEY`、`DATABASE_URL`、`JWT_SECRET`、`GEMINI_API_KEY`、`tc_REDIS_URL`）一律不加前綴，只在伺服器端使用。

---

## 7. Rate Limiting

限流以 `lib/rateLimit.ts`（Redis sliding window）實作，超限回 429 ＋ `Retry-After`。以下為本專案實際端點的限流要求：

| 端點 | 風險 | 狀態 |
|------|------|------|
| `POST /api/auth/login` | 暴力破解密碼 | 已實作 |
| `POST /api/auth/reset-password/request` | 帳號列舉 + 郵件轟炸 | 已實作 |
| `POST /api/upload/authorize` | 儲存空間濫用 | 已實作 |
| `POST /api/ai-coach/*`、`POST /api/exercises/[id]/ai-advice` | AI 費用攻擊 | 每日額度（`AI_COACH_DAILY_LIMIT`）|

新增高風險端點（認證、寄信、上傳、AI 呼叫）時，必須一併加入限流。

---

## 8. Code Review Checklist

審查程式碼時，主動掃描以下反模式：

| 項目 | 檢查要點 |
|------|----------|
| API 錯誤 | `catch` block 是否回傳 `error.message`、原始 exception 或硬編碼文案 |
| 帳號列舉 | 登入 / 忘記密碼是否根據帳號存在與否回傳不同 status code 或結構 |
| 輸入驗證 | 是否直接解構 `data` 未過 Zod |
| XSS | `dangerouslySetInnerHTML` 是否傳入 `generateHTML` 以外的內容 |
| 環境變數 | 機敏資料是否誤加 `NEXT_PUBLIC_` 前綴 |
| HTTP 方法 | State-changing 操作是否接受 GET，或用 `handleGetRequest` 包 POST |
| Log 安全 | `console.log` 是否含 token、密碼、signing key |
| 上傳回應 | API response 是否含伺服器路徑或檔案系統結構 |
| 敏感欄位 | User query 是否未用 `select` 而回傳 `password_hash` 等欄位 |
| URL 參數 | `searchParams.get()` 取得的值是否未驗證直接使用 |
| Rate Limiting | 新增的認證 / 寄信 / 上傳 / AI 端點是否有限流 |
