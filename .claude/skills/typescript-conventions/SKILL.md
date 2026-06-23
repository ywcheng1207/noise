---
name: typescript-conventions
description: TypeScript conventions for this project — Prisma type usage, Zod schema patterns, type strictness rules, and API response types. Use when defining types, writing API routes, creating Zod schemas, or working with Prisma query results.
---

# TypeScript Conventions

## Prisma Types

- 對應資料庫的資料結構禁止手動撰寫 `interface` 或 `type`
- 單張表完整資料一律使用 Prisma 自動產生的實體型別（e.g., `User`, `TrainingPlan`）
- 包含 JOIN（`include`）或部分挑選（`select`）的資料，使用 `Prisma.XXXGetPayload<...>` 推導精準型別
- 複合大型型別統一收攏至 `types/prisma.ts` 集中匯出

```ts
// 正確：用 GetPayload 推導含關聯的型別
type FullTrainingPlan = Prisma.TrainingPlanGetPayload<{
  include: { exercises: true; user: true }
}>
```

## Zod & Validation

- API Request Body 與表單 Payload 必須使用 Zod Schema 定義
- 透過 `z.infer<typeof schema>` 自動產生 TypeScript 型別，禁止手動重複定義
- 後端接收資料必須先通過 `schema.safeParse()` 取得強型別對象，禁止直接使用 `req.body`

```ts
const result = createUserSchema.safeParse(data)
if (!result.success) return errorResponse(result.error)
const { name, email } = result.data // 強型別
```

## Type Strictness

- **Union > Enum**：狀態一律優先使用字串 Union（`'ACTIVE' | 'INACTIVE'`），避免 Enum 在 runtime 的額外負擔與 Zod 轉換問題
- **禁止 Non-null Assertion（`!`）**：一律透過邏輯排除 `null`（`if (!data) return`）
- **禁止硬轉型（`as`）**：除非處理不支援 Generics 的第三方套件；應透過 Zod 驗證或正確泛型傳遞來取得型別
- **善用 Utility Types**：編輯表單型別通常是 `Partial<T>` 或 `Omit<T, 'id'>`
- 元件 Props 禁止使用 `any`
- 事件回呼 Props 命名規則為 `onXXX`，型別明確標注

## API Response

統一使用泛型結構：

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
}
```

- 成功時 `success: true`，回傳 `data`
- 失敗時 `success: false`，提供 `error` 字串供前端 `notify`
- 禁止將 Prisma 報錯（SQL error）直接傳回前端，後端攔截後轉為人可讀訊息

## Type Lifecycle

| 階段 | 來源 |
|------|------|
| 定義期 | Prisma Schema（DB）/ Zod Schema（API / Form）→ 自動產生型別 |
| 傳輸期 | `z.infer` 型別貫穿前後端 API 請求 |
| 渲染期 | `GetPayload` 型別確保元件接收的關聯資料完全符合預期 |
