---
name: styling-conventions
description: Styling conventions for this project — Tailwind CSS usage rules, class ordering, responsive design, shadcn UI patterns, typography, color tokens, and layout guidelines. Use when writing or reviewing any CSS, Tailwind classes, or UI component styling.
---

# Styling Conventions

## Tailwind CSS — Core Rules

- 禁止使用 Inline Style（`style={}`），所有樣式透過 Tailwind Utility Class
- 禁止撰寫自訂 CSS（除非 Tailwind 無法實現的特殊需求，如複雜 keyframe 動畫）
- 條件式樣式一律使用 `cn()`（clsx + twMerge），禁止手動字串拼接

```tsx
// ❌
className={`btn ${isActive ? 'bg-primary' : 'bg-muted'}`}

// ✅
className={cn('btn', isActive ? 'bg-primary' : 'bg-muted')}
```

## Class Ordering

佈局 → 尺寸 → 間距 → 外觀 → 互動 → 動畫

```
flex items-center gap-4   // 佈局
w-full h-10               // 尺寸
px-4 py-2                 // 間距
bg-primary text-white     // 外觀
hover:bg-primary/90       // 互動
transition-colors         // 動畫
```

## Responsive Design

- Mobile First：基礎樣式為手機版，透過 `sm:`, `md:`, `lg:` 遞增
- 可點擊元素須包含 `hover:`, `focus:`, `active:` 狀態樣式
- Dark Mode 一律使用 `dark:` 前綴；元件內禁止以 JS 判斷主題來分支樣式或切換 class（全域主題切換僅限 Provider 層依 Redux theme 狀態切換 root 的 `dark` class，這是唯一例外）

## shadcn UI

- 基礎 UI 元件一律使用 shadcn UI（Button, Dialog, Input, Select 等）
- 禁止重複造輪子：shadcn 已提供的元件禁止自行從頭實作
- 客製化透過 `variants` 或 `className` Props 擴展，禁止直接修改 shadcn 原始碼

## Typography

- 文字大小使用 Tailwind 預設 Scale（`text-sm`, `text-base`, `text-lg`），避免任意值（`text-[13px]`）
- 標題文字依斷點遞增：`text-lg md:text-xl lg:text-2xl`
- 行高：大標題用 `leading-tight`，內文用 `leading-relaxed`
- 文字粗細使用語意化 Class（`font-medium`, `font-semibold`），避免數值寫法（`font-[450]`）
- 長文字使用 `truncate` 或 `line-clamp-N` 控制溢出

## Color

- 一律透過 Tailwind Theme Token 引用（`text-primary`, `bg-muted`, `border-border`）
- 禁止硬編碼色碼（`text-[#ff0000]`, `bg-[#1a1a1a]`）

## Layout & Spacing

- 佈局容器優先使用 `flex` 與 `grid`，避免 `float`
- 元件之間的間距使用 `gap` 而非逐一設定 `margin`
- 頁面級容器：`max-w-{size} mx-auto`
- 間距優先使用 Tailwind Spacing Scale（`p-4`, `gap-6`），避免固定像素值
