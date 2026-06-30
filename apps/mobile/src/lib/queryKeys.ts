export const queryKeys = {
  transactions: (month?: string) => month ? ['transactions', month] : ['transactions'],
  cards: () => ['cards'],
  categories: () => ['categories'],
  importGallery: () => ['import', 'gallery'],
} as const

export type QueryKeyName = keyof typeof queryKeys
