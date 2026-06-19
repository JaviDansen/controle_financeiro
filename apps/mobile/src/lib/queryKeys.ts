export const queryKeys = {
  transactions: (month?: string) => month ? ['transactions', month] : ['transactions'],
  cards: () => ['cards'],
  categories: () => ['categories'],
} as const

export type QueryKeyName = keyof typeof queryKeys
