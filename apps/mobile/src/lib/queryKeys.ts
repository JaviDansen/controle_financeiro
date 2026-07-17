export const queryKeys = {
  transactions: (month?: string) => month ? ['transactions', month] : ['transactions'],
  cards: () => ['cards'],
  categories: () => ['categories'],
  goals: () => ['goals'],
  importGallery: () => ['import', 'gallery'],
  importConfirm: () => ['import', 'confirm'],
} as const

export type QueryKeyName = keyof typeof queryKeys
