const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

import { Goal } from '../src/types/finance'

export interface CreateGoalPayload {
  title: string
  targetAmount: number
  currentAmount: number
  deadline?: string | null
  category?: string | null
  color?: string | null
  emoji?: string | null
  isActive?: boolean
}

export type UpdateGoalPayload = Partial<CreateGoalPayload>

function calculateDaysLeft(deadlineStr: string | null): number | null {
  if (!deadlineStr) return null
  const deadlineDate = new Date(deadlineStr + 'T00:00:00')
  if (isNaN(deadlineDate.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffTime = deadlineDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays < 0 ? 0 : diffDays
}

export function formatDateLabel(dateStr: string | null): string {
  if (!dateStr) return 'sem prazo'
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const day = parseInt(parts[2], 10)
  const month = months[parseInt(parts[1], 10) - 1]
  const year = parts[0]
  return `${day} ${month} ${year}`
}

// Helper para converter formato de exibição visual (ex: "15 dez 2026") de volta a "YYYY-MM-DD"
export function parseDateLabelToYmd(labelStr: string | null): string | null {
  if (!labelStr || labelStr === 'sem prazo') return null
  const parts = labelStr.split(' ')
  if (parts.length !== 3) return null
  const months: Record<string, string> = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
  }
  const day = parts[0].padStart(2, '0')
  const month = months[parts[1].toLowerCase()]
  const year = parts[2]
  if (!month) return null
  return `${year}-${month}-${day}`
}

export function mapApiGoalToGoal(apiGoal: any): Goal {
  return {
    id: apiGoal.id,
    title: apiGoal.title,
    target: apiGoal.targetAmount,
    current: apiGoal.currentAmount,
    deadline: formatDateLabel(apiGoal.deadline),
    daysLeft: calculateDaysLeft(apiGoal.deadline),
    color: apiGoal.color ?? '#8B8B92',
    emoji: apiGoal.emoji ?? '🎯',
    active: apiGoal.isActive,
  }
}

export async function getGoals(token: string, isActive?: boolean): Promise<Goal[]> {
  const url = new URL(`${API_URL}/goals`)
  if (isActive !== undefined) {
    url.searchParams.append('isActive', String(isActive))
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao buscar metas')
  return (json.data ?? []).map(mapApiGoalToGoal)
}

export async function createGoal(payload: CreateGoalPayload, token: string): Promise<Goal> {
  const res = await fetch(`${API_URL}/goals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao criar meta')
  return mapApiGoalToGoal(json.data)
}

export async function updateGoal(id: string, payload: UpdateGoalPayload, token: string): Promise<Goal> {
  const res = await fetch(`${API_URL}/goals/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Erro ao atualizar meta')
  return mapApiGoalToGoal(json.data)
}

export async function deleteGoal(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_URL}/goals/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const json = await res.json()
    throw new Error(json.error ?? 'Erro ao excluir meta')
  }
}
