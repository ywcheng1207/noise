---
name: react-conventions
description: React and Next.js component conventions for this project — component definition style, file structure, internal code order, props/rendering rules, hooks, and async patterns. Use when writing, reviewing, or refactoring any React component or Next.js page/layout.
---

# React Conventions

## Component Definition

- 元件皆以 arrow function 定義，禁止 `function` 宣告式元件
- 禁止使用：`forwardRef`、`defaultProps`、`React.FC`
- 移除 `import React from 'react'`（Next.js 自動注入）
- 移除未使用的宣告（"declared but its value is never read"）

## File & Import Structure

- Import 順序（以空行間隔）：
  1. 原生 React / Next.js
  2. 第三方套件
  3. 客製化元件
  4. 客製化 Utils / hooks / types
- 路徑一律用 `@/` 引用，禁止相對路徑 `../../`
- 移除所有中英文說明性註解；區隔區塊的 `//` 可保留
- 超過 500 行考慮拆分，先寫在同一個檔案，按層級由小到大排列

## Internal Component Order

以 `//` 間隔，依序排列：

1. Hooks / Context / i18n（外部資源）
2. State / Ref（內部狀態）
3. 變數定義（衍生計算）
4. Function 定義（`handleXXX` / `fetchXXX`）
5. Effects（副作用）
6. JSX（渲染）

## Props & Rendering

- 在參數列直接解構 Props 並提供預設值
- 清單渲染必須提供穩定 key，禁止使用 index 或 `Math.random()`
- 禁止 `&&` 數字陷阱（`{count && <X />}` 在 count=0 時會渲染 `0`），改用三元運算子
- 避免三元運算子嵌套逾一層
- JSX 內禁止直接呼叫函式或放入複雜表達式，先賦值給語意清晰的變數再引用（例外：i18n 的 `t()`、`cn()` 等無副作用的顯示用純函式可直接在 JSX 呼叫）
- 禁止在 JSX 內定義 Inline Function（純粹參數傳遞如 `() => handler(id)` 除外）
- 避免以 `renderXXX` 函式替代子元件：包含結構性 JSX（完整卡片、列表項等）應抽出為獨立子元件

## Hooks & Async

- 確實填寫 `useEffect` 的 Dependency Array
- `setTimeout`、`setInterval`、事件監聽等必須包含 cleanup 函數
- 避免過度優化，僅在必要時使用 `useMemo` / `useCallback` / `memo`

## Next.js

- Page / Layout 接收動態路由時，`params` 與 `searchParams` 必須視為 `Promise` 並 `await`
- 共用頁面屬性應使用泛型介面（如 `BasePageProps<T>`）確保型別安全
