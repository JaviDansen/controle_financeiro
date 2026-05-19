import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth.store'
import { getCards } from '../services/cards.service'

export function useCards() {
  const token = useAuthStore(s => s.token)
  return useQuery({
    queryKey: ['cards'],
    queryFn: () => getCards(token!),
    enabled: !!token,
  })
}
