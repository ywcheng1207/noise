## 專案：Noise — 新聞事件過濾與可信度平台

以「核心議題 / 事件」為單位，自動偵測重點時事、跨來源（不限語系）研究、排出時序、講清來龍去脈、依可信度排名來源。三層資訊架構：**焦點總覽 → 核心議題頁 → 事件檔案頁**。

技術堆疊（比照 trace）：Next.js 15（App Router）+ React 19 + TypeScript + Prisma + PostgreSQL + Tailwind v4 + shadcn(radix) + i18next + Redux Toolkit + React Query + Zod + react-hook-form。AI 用 Google Gemini（`@google/genai`）。pnpm。部署 Vercel。

---

## 回應格式：SDD × Git Flow 進度圖

**推進了開發任務的回應，最開頭必須先放一張進度圖**（置於 code block 內，等寬對齊），把當前階段用 `【 】` 框起來，並在圖下用 `▶ 目前：<階段> — <剛做了什麼／下一步>` 點出位置。

階段對應（SDD 生命週期 ↔ git）：

| 階段 | 意義 | git 動作 |
|------|------|---------|
| explore | 釐清需求、想清楚（不寫 code） | 想法，尚未開 branch |
| propose | 建 change：proposal / design / tasks（+ delta spec） | 開 feature branch + spec commit |
| apply | 照 tasks 實作 | branch 上 commits |
| sync | delta 套回 `openspec/specs/` | 編輯 specs/ commit |
| archive | 歸檔 change | `git mv` → `changes/archive/` → merge main |

模板（把 `【 】` 移到當前階段）：

```
SDD:   explore → propose ────────── apply ────────── sync ──────── archive
                    │                  │                │              │
git:   (想法)   開 branch +        在 branch        編輯 specs/     git mv →
                spec commit         上 commits       吸收 delta     changes/archive/
                    │                                                  │
                    └───────────────── 同一個 PR ──────────────────────┘
                                            │
                                  merge → main → Vercel prod
▶ 目前：<階段> — <一句話>
```

規則：
- 只在「實際推進開發任務」（實作、修 bug、SDD 任一步）的回應放此圖；純討論、問答、查詢不放。
- **依變更規模分流（AI 自行判定）**：
  - **大 feature / 改對外行為** → 走 feature branch + SDD + PR；branch 上 `sync + archive` 完成後，圖下標 `✅ 分支完成，可開 PR`，主動提示去處理 PR。
  - **小修 / 重構 / 設定 / 文件（非 feature）** → 不走 change、不開 PR；圖下標 `⚠ 此任務未走 change 流程（直接 main）`，`▶` 指向對應 git 動作，並在**回應結尾主動問一句**「要不要直接合併進 main？」。

---

## Skills

遇到以下場景時，讀取對應 skill 的規範並遵循：

- 寫 API route、前台 fetch、表單、彈窗、i18n → @.claude/skills/project-conventions/SKILL.md
- 寫或審查任何 React 元件、Next.js page/layout → @.claude/skills/react-conventions/SKILL.md
- 定義型別、寫 Zod schema、處理 Prisma 查詢結果 → @.claude/skills/typescript-conventions/SKILL.md
- 寫 JS/TS 邏輯、util 函式、code review → @.claude/skills/javascript-conventions/SKILL.md
- 實作表單、全域狀態、資料 fetch 或 mutation → @.claude/skills/state-management/SKILL.md
- 命名任何變數、函式、元件、檔案或型別 → @.claude/skills/naming-conventions/SKILL.md
- 寫或審查 Tailwind class、shadcn 元件、RWD 樣式 → @.claude/skills/styling-conventions/SKILL.md
- 效能優化、bundle 分析、SSR/RSC 調整 → @.claude/skills/vercel-react-best-practices/SKILL.md
- UI 設計選型、配色、字型 → @.claude/skills/ui-ux-pro-max/SKILL.md（產出的顏色仍須遵循 styling-conventions 的 Theme Token 規則）
- 寫 API 錯誤處理、處理用戶輸入、Code Review 涉及認證/授權/敏感資料的程式碼 → @.claude/skills/security-conventions/SKILL.md
- **任何呼叫 Gemini API 的程式（摘要、分群、研究、評分、Google Search 接地）** → 用官方 `@google/genai`，統一走 `lib/gemini.ts`

---

## Hard Rules

### API
- 前台 fetch 一律用 `apiFetch`（`lib/apiClient.ts`），禁止直接使用 `fetch`
- API Route 一律用 `apiHandler` wrapper（`lib/apiHandler.ts`），回傳一律 `ApiResponse<T>`（`types/api.ts`）

### TypeScript
- 禁止 `any`、`!`（non-null assertion）；禁止 `as`（唯一例外：不支援泛型的第三方套件），`unknown` 須經 Zod 或型別守衛收窄後使用
- 禁止手動寫對應 DB 的 `interface` / `type`，用 Prisma 自動產生的型別（`lib/generated/prisma`）

### React
- 禁止 `var`、`forwardRef`、`defaultProps`、`React.FC`
- 禁止 `import React from 'react'`
- 清單渲染禁止用 index 或 `Math.random()` 當 key

### Styling
- 禁止 `style={}`，禁止自訂 CSS（特殊動畫除外）
- 禁止硬編碼色碼，一律用 Tailwind Theme Token
- 條件式 class 用 `cn()`；條件太多時優先拆元件

### State
- Redux 禁止儲存 Server State（DB 資料）
- Server State 一律用 React Query（`@tanstack/react-query`），禁止用 SWR

### AI / Gemini（本專案核心）
- 一律用官方 `@google/genai`；模型 ID 用 `gemini-2.5-flash-lite`（分群）、`gemini-2.5-flash`（事件研究＋接地）、`gemini-2.5-pro`（最難推理，可選）
- 結構化輸出用 `responseMimeType: 'application/json'`；事件研究用 Google Search 接地（`tools: [{ googleSearch: {} }]`，不可與 responseMimeType 並用，靠 prompt 指示 + 解析）
- 統一走 `lib/gemini.ts` 的 `generateJson` / `generateJsonWithSearch`，禁止在各處直接 new client
- 每次呼叫的 token/搜尋/成本寫入 `AiRun`

### 地圖（Hard Rule）
- 地圖一律用**真實地理邊界**（d3-geo + TopoJSON world-atlas），**禁止用幾何圖形拼湊**示意地圖

### 資料 / 管線
- 對外呈現只給標題＋自製摘要＋原文連結，**不重製全文**；全文僅後端暫存且設保存期限
- 管線各階段以 Prisma `status` 欄位做冪等控制；排程用 Vercel Cron，長步驟（事件研究）卸載到佇列

---

## 開發環境

- 資料庫：**本地 PostgreSQL**（`DATABASE_URL` 指向 localhost；prod 再換 Neon/Vercel Postgres）
- i18n：`en` + `zh-Hant`（路由 `app/[lng]/...`）
- 指令：`pnpm dev` / `pnpm build`（`prisma generate && next build`）/ `pnpm db:ui`（Prisma Studio）/ `pnpm db:setup`（migrate + seed）
- 慣例風格：tab 縮排、單引號、無分號（比照 trace，交給 Prettier）
