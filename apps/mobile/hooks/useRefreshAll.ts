import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys, QueryKeyName } from '../src/lib/queryKeys'

export function useRefreshAll(skip?: QueryKeyName[]) {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)

    const allKeys = Object.keys(queryKeys) as QueryKeyName[]
    const toInvalidate = allKeys.filter(k => !skip?.includes(k))

    await Promise.all(
      toInvalidate.map(k => queryClient.invalidateQueries({ queryKey: [k] }))
    )

    setRefreshing(false)
  }, [queryClient, skip])

  return { refreshing, refresh }
}
