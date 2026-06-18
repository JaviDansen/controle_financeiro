import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getCategories, createCategory, Category } from '../services/categories.service'

export function useCategories() {
  const token = useAuthStore(state => state.token)

  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(token!),
    enabled: !!token,
  })
}

export function useCreateCategory() {
  const token = useAuthStore(state => state.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { name: string; color?: string; icon?: string }) =>
      createCategory(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
