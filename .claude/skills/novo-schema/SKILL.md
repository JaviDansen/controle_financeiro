# Skill: novo-schema

Adiciona uma nova tabela ao schema Drizzle do FinApp seguindo os padrões do projeto.

## Quando usar

`/novo-schema <tabela>` — ex: `/novo-schema notificacoes`

## O que esta skill cria

1. `packages/db/schema/<tabela>.ts` — definição da tabela
2. Atualiza `packages/db/schema/index.ts` para exportar a nova tabela

Após criar, instrui a rodar `/migrar-db` para gerar e aplicar a migration.

## Padrão de schema

```ts
import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users'

export const <tabela> = pgTable('<tabela>', {
  // Chave primária — sempre UUID
  id: uuid('id').primaryKey().defaultRandom(),

  // Foreign key para usuário — obrigatório na maioria das tabelas
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Campos do negócio...

  // Timestamps — sempre presentes
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Tipos inferidos para usar no TypeScript
export type <Tabela> = typeof <tabela>.$inferSelect
export type New<Tabela> = typeof <tabela>.$inferInsert
```

## Tipos disponíveis do Drizzle (PostgreSQL)

| Tipo TS | Drizzle | Uso |
|---|---|---|
| `string` | `varchar(n)` | Textos curtos com limite |
| `string` | `text` | Textos longos sem limite |
| `string` | `uuid` | IDs e foreign keys |
| `number` | `integer` | Inteiros |
| `string` | `numeric(p,s)` | Valores monetários (retorna string) |
| `boolean` | `boolean` | Flags |
| `Date` | `timestamp` | Datas com hora |
| `string` | `date` | Só data (YYYY-MM-DD) |

**Valores monetários sempre como `numeric(12, 2)`** — não usar `float` ou `real`.

## Regras

- Todo schema exporta os tipos `typeof tabela.$inferSelect` e `.$inferInsert`
- Colunas monetárias: `numeric(12, 2)`, nunca `float`
- Datas: `date` para só data, `timestamp` para data+hora
- `onDelete: 'cascade'` para FK de `userId` — apagar usuário limpa seus dados
- Nomear colunas em `snake_case` no banco, `camelCase` no TypeScript
- Após criar, sempre atualizar `packages/db/schema/index.ts`

## Após criar o schema

1. Atualizar `schema/index.ts` com `export * from './<tabela>'`
2. Rodar `/migrar-db` para gerar e aplicar a migration
3. Criar a rota correspondente com `/nova-rota <tabela>` se necessário
