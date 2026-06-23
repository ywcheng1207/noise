---
name: project-conventions
description: Project-specific API patterns, encryption wrappers, i18n rules, UI feedback, and component conventions for this Next.js app. Use when writing API routes, frontend fetch calls, forms, dialogs, or any feature requiring user feedback or loading states.
---

# Project Conventions

## API Requests (Frontend)

- 前台會員功能統一使用 `@/hooks/useApi` 的 `apiFetch`，自動處理加密、Token 與通知
- Control 資料夾下的功能以 Next.js 基礎 fetch API 為主
- 取得 IP 與 Shared Secret 等邏輯已封裝，禁止手動實作
- 禁止在元件層手動處理 API 錯誤通知，統一由 `apiFetch` 或 React Query 全域配置處理

## API Routes (Backend)

- 前台 API 必須使用 `@/lib/crypto/apiHandler` 的 Wrapper 建立
- GET 使用 `handleGetRequest`，POST/PUT/DELETE 使用 `handleEncryptedRequest`
- 禁止手動解析 Token 或解密 Payload，應使用 Wrapper 注入的 `userId` 與 `data`
- API 回應一律使用泛型：`type ApiResponse<T> = { success: boolean; data?: T; error?: string }`
- 禁止將 Prisma 報錯資訊直接傳回前端，應攔截並轉義為可讀訊息

## i18n

- 新增任何文字節點時，必須同步更新所有語系的 JSON 檔案
- 禁止直接在 JSX 裡寫死中文或英文字串

## UI Feedback & Loading

- CRUD 或重要狀態變更必須提供 User Feedback（使用 `notify` 或 `dispatch`）
- 必須處理 Loading State，避免畫面無反應
- 禁止在元件層手動 `catch` API 錯誤後自行呼叫 `notify`，統一由 `apiFetch` 處理

## Component Conventions

- 表單一律使用客製化的 `AppFormField` 元件，注意欄位連動邏輯
- 彈窗使用 shadcn UI 的 `Dialog`
- 通知一律使用專案 `notify` 系統，禁止使用原生 `alert` 或其他 toast library
