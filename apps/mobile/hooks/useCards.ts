import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getCards, createCard, updateCard, deleteCard, CreateCardPayload, UpdateCardPayload, CreditCard, DebitCard } from '../services/cards.service'

export function useCards() {
  const token = useAuthStore(s => s.token)

  const query = useQuery({
    queryKey: ['cards'],
    queryFn: () => getCards(token!),
    enabled: !!token,
  })

  const allCards = query.data ?? []

  const creditCards = useMemo(() => {
    const items = allCards.filter((c): c is CreditCard => c.type === 'credit')
    return {
      items,
      total: items.length,
      hasCards: items.length > 0,
    }
  }, [allCards])

  const debitCards = useMemo(() => {
    const items = allCards.filter((c): c is DebitCard => c.type === 'debit')
    return {
      items,
      total: items.length,
      hasCards: items.length > 0,
    }
  }, [allCards])

  return {
    ...query,
    allCards,
    creditCards,
    debitCards,
  }
}

export function useCreateCard() {
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCardPayload) => createCard(payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })
}

export function useUpdateCard() {
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCardPayload }) =>
      updateCard(id, payload, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
    },
  })
}

export function useDeleteCard() {
  const token = useAuthStore(s => s.token)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCard(id, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
