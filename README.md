# Noise — 新聞事件過濾與可信度平台

以「核心議題 / 事件」為單位，幫讀者篩選與查證資訊：自動偵測重點時事 → 跨來源（不限語系）AI 研究 → 排出時間序列、講清來龍去脈、依可信度排名來源（標示官方/最高可信來源）。

三層資訊架構：

1. **焦點總覽** — 以 `領域 × 時間區間 × 地區` 篩選現有核心議題；hover 議題 → 真實世界地圖高亮相關地區。
2. **核心議題頁** — 一個核心議題為中心，旗下事件沿時間往外擴散。
3. **事件檔案頁** — 來龍去脈敘事 + 時間序列 + 來源可信度排名。

## 技術堆疊

Next.js 15 (App Router) · React 19 · TypeScript · Prisma · PostgreSQL · Tailwind v4 · shadcn/ui · i18next (en / zh-Hant) · Redux Toolkit · React Query · Zod · Anthropic Claude (`@anthropic-ai/sdk`)。部署 Vercel。

## SDD 文件

規格在 `openspec/changes/news-credibility-platform/`：`proposal.md`、`design.md`、`tasks.md`、`specs/`。慣例見 `CLAUDE.md` 與 `.claude/skills/`。

## 本地開發

```bash
pnpm install
cp .env.example .env.local        # 填入 DATABASE_URL / ANTHROPIC_API_KEY 等
pnpm prisma migrate dev           # 建表
pnpm tsx scripts/seed.ts          # 載入示範資料
pnpm dev
```

需要：本地 PostgreSQL、Anthropic API key。資料更新與管線觸發見 `docs` / cron 設定。
