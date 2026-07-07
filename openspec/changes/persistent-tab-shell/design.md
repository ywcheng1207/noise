## 路由分組

用 Next.js route group `app/[lng]/(shell)/` 包住 `page.tsx`、`topic/[slug]/`、`event/[slug]/`、`log/`、`log/[date]/` 與對應的 `@breadcrumb` parallel route。route group 不產生 URL segment，所以 `/{lng}/topic/xxx` 等既有路徑不變。`(shell)/layout.tsx` 是新的持續存在殼層；`terms/` 留在 `(shell)` 外，維持現狀。

## Tab 狀態怎麼決定

`TabShell`（client component，放在 `(shell)/layout.tsx` 裡）用 `usePathname()` 判斷：

```
pathname startsWith `/{lng}/log`               → activeTab = 'log'
pathname startsWith `/{lng}/topic` 或 `/event`  → activeTab = 'topics'
其餘（就是 `/{lng}` 根路徑）                      → activeTab = 本地 state（預設 'intro'）
```

只有根路徑這一種情況需要本地 state，因為「介紹」與「議題清單」都掛在同一個 URL 上，沒有路徑可以區分。切 tab 的行為：

- 點「日誌」：`router.push('/{lng}/log')`
- 點「議題」：若目前不在根路徑，`router.push('/{lng}')` 再把本地 state 設成 `'topics'`；已經在根路徑就只切本地 state，不導頁
- 點「介紹」：同「議題」邏輯，但本地 state 設成 `'intro'`

`Tabs` 改成 controlled（`value={activeTab} onValueChange={...}`），不再是先前的 `defaultValue` 寫法。

## 內容怎麼放

- `activeTab==='intro'` 且在根路徑：渲染新的 `IntroContent`（純文字，無需路由資料）。
- 其餘情況：渲染 `{children}`（Next.js 依目前路由塞入的頁面內容——可能是議題清單、議題頁、事件頁、日誌列表、日誌單日），`{breadcrumb}` 一併放在同一個內容區塊的最上方。

`page.tsx`（Overview）Server Component 一律照舊抓資料、渲染簡化後的 `OverviewClient`（只剩清單，不再自己包 Tabs）；即使目前是「介紹」在顯示，這份資料還是會在背景抓好——這跟改動前的行為一致（兩個 tab 的內容本來就都會先備妥，只是切換用 CSS/state 決定顯示哪個），不是新增的成本。

## useIncrementalReveal 的 bug

原本用 `useRef` 存 sentinel + 另一個 `useEffect(..., [items.length])` 建立 IntersectionObserver。當 `items`（陣列參照）換了但 `items.length` 沒變時：第一個 effect 會把 `visibleCount` 重置回 `PAGE_SIZE`（可能讓 `hasMore` 從 false 翻回 true、sentinel 重新掛載），但第二個 effect 不會重建 observer（依賴沒變），新掛載的 sentinel 就完全沒人 observe——使用者捲到底也不會再觸發載入，spinner 卡住不消失。

改用 callback ref：observer 的建立/銷毀跟 sentinel DOM node 的掛載/卸載綁在同一個時間點（callback ref 被呼叫的當下），不再依賴另一個 effect 的相依陣列去猜「這次要不要重建」。`setVisibleCount` 也改成單純遞增（不在 closure 裡對 `items.length` 取 min），讓 `hasMore` 永遠用當次 render 最新的 `items.length` 計算，不會有 stale closure。
