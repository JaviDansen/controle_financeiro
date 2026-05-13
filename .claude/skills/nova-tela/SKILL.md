# Skill: nova-tela

Cria uma nova tela no mobile seguindo o padrão do projeto FinApp.

## Quando usar

`/nova-tela <nome> <grupo>` — ex: `/nova-tela transacoes tabs` ou `/nova-tela login auth`

Grupos disponíveis:
- `auth` → `apps/mobile/app/(auth)/`
- `tabs` → `apps/mobile/app/(tabs)/`

## O que esta skill cria

1. `apps/mobile/app/(<grupo>)/<nome>.tsx` — tela principal
2. `apps/mobile/hooks/use<Nome>.ts` — hook React Query (se a tela busca dados)
3. `apps/mobile/services/<nome>.ts` — funções de chamada à API (se necessário)

## Padrão de tela com dados (tabs)

```tsx
import { View, Text, FlatList } from 'react-native'
import { use<Nome> } from '@/hooks/use<Nome>'

export default function <Nome>Screen() {
  const { data, isLoading } = use<Nome>()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Carregando...</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white px-4 pt-6">
      {/* conteúdo */}
    </View>
  )
}
```

## Padrão de hook React Query (`hooks/use<Nome>.ts`)

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get<Nome>, create<Nome> } from '@/services/<nome>'

export function use<Nome>() {
  return useQuery({
    queryKey: ['<nome>'],
    queryFn: get<Nome>,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

export function useCreate<Nome>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: create<Nome>,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['<nome>'] }),
  })
}
```

## Padrão de service (`services/<nome>.ts`)

```ts
import { API_URL } from '@/constants/api'

export async function get<Nome>() {
  const res = await fetch(`${API_URL}/<rota>`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Erro ao buscar dados')
  const { data } = await res.json()
  return data
}
```

## Padrão de tela de autenticação (auth)

```tsx
import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useForm } from 'react-hook-form'  // opcional
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginScreen() {
  const router = useRouter()
  // ...
}
```

## Regras

- **Sempre NativeWind** para estilos — nunca `StyleSheet.create`
- **Sempre React Query** para busca de dados — nunca `useEffect` + `fetch` direto
- **Nunca** armazenar token em estado local — usar `expo-secure-store` via store Zustand
- Usar `useRouter()` para navegação programática
- Tratar sempre os estados: `isLoading`, `isError`, lista vazia
- Componentes reutilizáveis vão em `components/`, não dentro da tela

## Telas do MVP já mapeadas

| Tela | Grupo | Arquivo |
|---|---|---|
| Login | auth | `(auth)/login.tsx` |
| Registro | auth | `(auth)/register.tsx` |
| Recuperar senha | auth | `(auth)/forgot-password.tsx` |
| Home / Dashboard | tabs | `(tabs)/index.tsx` |
| Transações | tabs | `(tabs)/transactions.tsx` |
| Cartões | tabs | `(tabs)/cards.tsx` |
| Metas | tabs | `(tabs)/goals.tsx` |
| Perfil | tabs | `(tabs)/profile.tsx` |
