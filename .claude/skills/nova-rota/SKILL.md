# Skill: nova-rota

Cria uma nova rota completa na API seguindo o padrão do projeto FinApp.

## Quando usar

`/nova-rota <módulo>` — ex: `/nova-rota cartoes` ou `/nova-rota dashboard`

## O que esta skill cria

Para cada módulo, cria ou atualiza:

1. `apps/api/src/routes/<modulo>.ts` — registra os endpoints Express
2. `apps/api/src/controllers/<modulo>.ts` — lógica de negócio
3. Registra a rota no `apps/api/src/index.ts`

## Padrão obrigatório

### Route file (`routes/<modulo>.ts`)
```ts
import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth'
import * as controller from '../controllers/<modulo>'
import { validate } from '../middlewares/validate'
import { createSchema, updateSchema } from '../middlewares/schemas/<modulo>'

const router = Router()
router.use(authMiddleware)

router.get('/', controller.list)
router.post('/', validate(createSchema), controller.create)
router.get('/:id', controller.getById)
router.patch('/:id', validate(updateSchema), controller.update)
router.delete('/:id', controller.remove)

export default router
```

### Controller file (`controllers/<modulo>.ts`)
```ts
import { Request, Response } from 'express'
import { db } from '@finapp/db'
import { <tabela> } from '@finapp/db'
import { eq, and } from 'drizzle-orm'

export async function list(req: Request, res: Response) {
  const userId = req.userId  // sempre do JWT, nunca do body

  const items = await db.select().from(<tabela>).where(eq(<tabela>.userId, userId))
  res.json({ data: items })
}

export async function create(req: Request, res: Response) {
  const userId = req.userId
  // ...
}
```

## Regras

- **Sempre** aplicar `authMiddleware` no router
- **Sempre** usar `userId` de `req.userId` (injetado pelo middleware)
- **Nunca** expor `passwordHash`
- **Sempre** validar entrada com Zod via `validate()` middleware
- Importar tipos do banco de `@finapp/db`, nunca duplicar
- Respostas de sucesso: `{ data: ... }` | Erros: `{ error: true, message: '...' }`

## Após criar

Verificar se a rota está registrada em `apps/api/src/index.ts`:
```ts
import <modulo>Routes from './routes/<modulo>'
app.use('/<modulo>', <modulo>Routes)
```

## Módulos existentes no MVP

- `auth` — login, registro, logout (sem authMiddleware nas rotas públicas)
- `users` — perfil do usuário autenticado
- `transactions` — CRUD de receitas e despesas
- `categories` — categorias por usuário
- `cards` — cartões de crédito e débito
- `goals` — metas financeiras
- `dashboard` — resumo e totais mensais
