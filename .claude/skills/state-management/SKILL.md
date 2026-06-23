---
name: state-management
description: State management conventions for this project — React Hook Form for forms, Redux for global UI state, and React Query (@tanstack/react-query) for server state. Use when implementing forms, global state, data fetching, or mutations.
---

# State Management

> This project uses `@tanstack/react-query`. SWR is not used — ignore any SWR-related suggestions.

## React Hook Form（Form / Draft State）

- RHF 專注於「草稿狀態」，禁止將表單輸入過程同步至 Redux 或父元件 `useState`
- 使用 `useForm` 管理內部狀態，確保高頻輸入更新不觸發大範圍 re-render
- 提交前資料驗證由 Zod 負責，RHF 僅負責收集欄位值與呈現驗證錯誤

```ts
const form = useForm<CreateUserRequest>({
  resolver: zodResolver(createUserSchema),
})
```

## Redux（Global UI State Only）

- 嚴禁在 Redux 中快取 Server State（DB 資料），避免雙重來源導致資料不同步
- Redux 僅限用於跨頁面、非持久化的 UI 狀態：
  - Sidebar 展開 / 收合
  - 全域通知系統（Notification / Toast）
  - 當前語系（i18n）
  - 主題模式（Theme）
- 非全域狀態優先使用 Component Props 傳遞，其次 `useState`

## React Query（Server State）

- 伺服器資料一律由 React Query 管理，禁止儲存於 Redux 或手動 `useState` 同步
- 查詢使用 `useQuery`，設定合理的 `staleTime` 避免不必要的重複請求

```ts
const { data, isLoading } = useQuery({
  queryKey: QUERY_KEYS.userProfile(userId),
  queryFn: () => apiFetch('/api/user/profile'),
  staleTime: 1000 * 60 * 5,
})
```

- 資料變更使用 `useMutation`，在 `onSuccess` 執行 `queryClient.invalidateQueries`

```ts
const mutation = useMutation({
  mutationFn: (data: UpdateUserRequest) => apiFetch('/api/user', { method: 'PUT', body: data }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userProfile(userId) })
    notify('success', t('notify:update_success'))
  },
})
```

- 善用 `isLoading` / `isFetching` 狀態處理 Loading UI
- Query Key 必須唯一且具描述性，集中存放於常量定義中（`QUERY_KEYS`）
- 前台 API 請求強制使用 `apiFetch`，禁止直接使用 `fetch`
