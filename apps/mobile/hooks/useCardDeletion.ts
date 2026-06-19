import { useState } from 'react'
import { Alert } from 'react-native'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { deleteCard, CardHasTransactionsError, BlockedTransaction, Card } from '../services/cards.service'
import { updateTransaction } from '../services/transactions.service'

export function useCardDeletion(cards: Card[]) {
  const queryClient = useQueryClient()
  const token = useAuthStore(s => s.token)

  const [blockedTxs, setBlockedTxs] = useState<BlockedTransaction[]>([])
  const [reassignCardId, setReassignCardId] = useState<string | null>(null)
  const [reassignTargets, setReassignTargets] = useState<Record<string, string | null>>({})

  const otherCards = cards.filter(c => c.id !== reassignCardId)

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      if (!token) throw new Error('Sessao invalida. Faca login novamente.')
      return deleteCard(cardId, token)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cards'] })
      Alert.alert('Cartao removido', 'O cartao foi removido com sucesso.')
    },
    onError: (error, cardId) => {
      if (error instanceof CardHasTransactionsError) {
        setBlockedTxs(error.transactions)
        setReassignCardId(cardId)
        const initial: Record<string, string | null> = {}
        error.transactions.forEach(tx => { initial[tx.id] = null })
        setReassignTargets(initial)
      } else {
        Alert.alert('Erro ao excluir', error instanceof Error ? error.message : 'Nao foi possivel excluir o cartao.')
      }
    },
  })

  const reassignMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('Sessao invalida')
      await Promise.all(
        blockedTxs.map(tx => {
          const target = reassignTargets[tx.id]
          const isCard = target !== null && !['pix', 'transfer', 'boleto'].includes(target ?? '')
          return updateTransaction(tx.id, { cardId: isCard ? target : null }, token)
        })
      )
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['cards'] })
      const cardId = reassignCardId
      setBlockedTxs([])
      setReassignCardId(null)
      if (cardId) deleteCardMutation.mutate(cardId)
    },
    onError: () => {
      Alert.alert('Erro', 'Nao foi possivel remanejar as transacoes. Tente novamente.')
    },
  })

  function handleDelete(card: Card) {
    Alert.alert('Excluir cartao', 'Deseja realmente excluir este cartao?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteCardMutation.mutate(card.id) },
    ])
  }

  function handleReassignConfirm() {
    reassignMutation.mutate()
  }

  function handleReassignCancel() {
    setBlockedTxs([])
    setReassignCardId(null)
  }

  return {
    blockedTxs,
    otherCards,
    reassignTargets,
    setReassignTargets,
    handleDelete,
    handleReassignConfirm,
    handleReassignCancel,
    isDeleting: deleteCardMutation.isPending,
    isReassigning: reassignMutation.isPending,
  }
}
