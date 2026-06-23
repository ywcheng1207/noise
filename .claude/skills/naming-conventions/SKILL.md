---
name: naming-conventions
description: Naming conventions for this project — variables, booleans, functions, events, components, files, TypeScript types, Zod schemas, and Prisma payloads. Use when naming anything: variables, functions, components, files, or types.
---

# Naming Conventions

## General Principles

- 命名描述「意圖」而非「實作細節」
- 一律使用英文，禁止拼音或注音
- 避免縮寫（除業界通用：`id`, `err`, `req`, `res`, `ctx`, `ref`）

## Variables

| 類型 | 格式 | 範例 |
|------|------|------|
| 一般變數 | `camelCase` | `userProfile`, `totalCount` |
| 全域常量 | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRY` |
| 布林值 | `is/has/should/can` 前綴 | `isVisible`, `hasToken`, `canEdit` |
| 複雜 UI 顯示邏輯 | `showXXX` | `showDeleteConfirm`, `showSidebar` |

## Functions & Events

| 類型 | 格式 | 範例 |
|------|------|------|
| 一般函式 | 動詞開頭 `camelCase` | `validateForm`, `parseDate` |
| 非同步取資料 | `fetchXXX` / `getXXX` | `fetchUserProfile`, `getTrainingList` |
| 事件處理（定義端） | `handleXXX` | `handleSaveClick`, `handleFormSubmit` |
| 事件處理（Props 接收端） | `onXXX` | `onSave`, `onClose`, `onChange` |

## Components & Files

| 類型 | 格式 | 範例 |
|------|------|------|
| 元件名稱 | `PascalCase` | `TrainingCard`, `UserAvatar` |
| 頁面專屬元件 | 頁面名稱為前綴 | `TrainingPageHeader`, `TrainingPageHeaderNav` |
| 共用元件 | 語意明確，不加頁面前綴 | `StatusBadge`, `ConfirmDialog` |
| 元件檔案 | 與元件名稱一致 `PascalCase` | `TrainingPageHeader.tsx` |
| Hook 檔案 | `use` 前綴 `camelCase` | `useTrainingList.ts` |
| Util 檔案 | `camelCase` | `dateUtils.ts`, `formatCurrency.ts` |

## TypeScript & Data

| 類型 | 格式 | 範例 |
|------|------|------|
| Interface / Type | `PascalCase` | `UserProfile`, `TrainingPlan` |
| Zod Schema | `camelCase` + `Schema` | `userSchema`, `createTrainingSchema` |
| Request Payload | `PascalCase` + `Request` | `CreateUserRequest`, `UpdatePlanRequest` |
| Prisma Payload（含關聯） | `Full` 前綴 | `FullTrainingPlan`, `FullUserProfile` |
| Enum-like Union | `UPPER_SNAKE_CASE` 字串 | `'ACTIVE' \| 'INACTIVE'` |
