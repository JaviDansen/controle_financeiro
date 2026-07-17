import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  CreateGoalPayload,
  UpdateGoalPayload
} from '../services/goals.service'

export function useGoals(isActive?: boolean) {
  const token = useAuthStore((s) => s.token)

  return useQuery({
    queryKey: isActive !== undefined ? ['goals', { isActive }] : ['goals'],
    queryFn: () => getGoals(token!, isActive),
    enabled: !!token,
  })
}

export function useCreateGoal() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGoalPayload) => createGoal(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useUpdateGoal() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGoalPayload }) =>
      updateGoal(id, payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}

export function useDeleteGoal() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteGoal(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
  })
}
