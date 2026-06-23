---
name: javascript-conventions
description: JavaScript best practices for this project — variable declarations, async patterns, object/array handling, and function design rules. Use when writing any JS/TS logic, utility functions, or reviewing code quality.
---

# JavaScript Conventions

## Variables & Strings

- 優先使用 `const`，只有需重新賦值時使用 `let`，禁止 `var`
- 字串拼接一律使用 Template Literals（`` ` `` ），禁止字串相加
- 禁止手動賦值 `undefined`；需要表達空值一律使用 `null`（區分系統未初始化與開發者主動確認的空值）

## Control Flow & Types

- 非同步一律使用 `async/await` 搭配 `try/catch`，禁止混用 `.then().catch()`
- 善用 Optional Chaining（`?.`）與 Nullish Coalescing（`??`）簡化空值檢查
- 一律使用 `===` 與 `!==`，禁止 `==`
- 型別轉換必須顯式（`Number(val)`, `String(val)`），禁止隱性轉型

## Objects & Arrays

- 優先使用解構賦值與展開運算子（`...`）
- 屬性同名時使用 Shorthand 寫法（`{ name }` 而非 `{ name: name }`）
- 陣列迭代優先使用 `map`, `filter`, `reduce`, `find` 取代 `for` 迴圈
- 避免 Mutation：保持函式純粹，禁止直接修改傳入的參數或全域變數

## Numbers & Dates

- 禁止直接使用浮點數運算（`0.1 + 0.2` 等），應使用 `decimal.js` 或先轉為整數處理
- 日期時間一律使用 `date-fns`（專案唯一日期庫，禁止引入 dayjs / moment 等第二套），禁止手動 parse 字串

## Function Design

- 一個函式只做一件事，名稱應能完整描述其行為
- 超過 30 行考慮拆分為多個子函式
- 巢狀層級（if / for / callback）不超過 3 層，過深應提取子函式
- 超過 3 個參數改用物件解構傳入
- 必填參數在前，選填參數在後並提供預設值
- 禁止用布林參數控制函式分支（Boolean Trap）—— 應拆成兩個語意明確的函式

```ts
// ❌ Boolean Trap
function fetchData(useCache: boolean) { ... }

// ✅
function fetchFresh() { ... }
function fetchCached() { ... }
```

- 善用 Early Return 先處理邊界情況，減少巢狀
- 同一函式的回傳型別必須一致，避免有時回傳物件、有時回傳 `null`、有時回傳 `undefined`
- 工具函式（utils）必須為純函式：相同輸入產生相同輸出，不依賴也不修改外部狀態
- 有副作用的操作（API 呼叫、DOM 操作、狀態修改）集中在元件層或專屬 Hook，不應藏在 util 內
- 禁止複製貼上：重複邏輯超過兩次應抽成共用函式
- 同一函式內的程式碼應處於相同抽象層級，低階操作應封裝成子函式
