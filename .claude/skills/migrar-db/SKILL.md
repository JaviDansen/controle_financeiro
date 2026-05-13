# Skill: migrar-db

Gerencia operações de banco de dados: geração de migrations, aplicação e inspeção do schema.

## Quando usar

`/migrar-db` — após alterar qualquer arquivo em `packages/db/schema/`

## Fluxo completo

### 1. Verificar o que mudou
Antes de qualquer coisa, ler os arquivos alterados em `packages/db/schema/` para entender a mudança.

### 2. Gerar a migration
```bash
npm run db:generate
```
Isso cria um novo arquivo SQL em `packages/db/migrations/`. Verificar se o arquivo gerado reflete exatamente o que foi alterado no schema.

### 3. Revisar o arquivo de migration gerado
Ler o arquivo `.sql` gerado antes de aplicar. Verificar se:
- Não há `DROP TABLE` inesperado
- Colunas `NOT NULL` novas têm `DEFAULT` ou foram adicionadas com dados existentes em mente
- Foreign keys estão corretas

### 4. Aplicar no banco
```bash
npm run db:migrate
```

### 5. Verificar (opcional)
```bash
npm run db:studio
```
Abre o Drizzle Studio em `https://local.drizzle.studio` para inspecionar as tabelas visualmente.

## Regras

- **Nunca editar** arquivos dentro de `packages/db/migrations/` manualmente
- Após adicionar coluna `NOT NULL` em tabela existente, sempre definir `default()` no schema
- Se o banco já tiver dados e a migration for destrutiva, avisar o usuário antes de aplicar
- A `DATABASE_URL` precisa estar no `.env` para os comandos funcionarem

## Tabelas do schema atual (Fase 1)

| Tabela | Arquivo | Relações |
|---|---|---|
| `users` | `schema/users.ts` | — |
| `categories` | `schema/categories.ts` | `userId → users.id` |
| `cards` | `schema/cards.ts` | `userId → users.id` |
| `transactions` | `schema/transactions.ts` | `userId`, `categoryId`, `cardId` |
| `goals` | `schema/goals.ts` | `userId → users.id` |

## Seed de categorias padrão

Após rodar as migrations pela primeira vez, inserir as categorias padrão:

```ts
// Executar via Drizzle Studio ou script separado
const defaultCategories = [
  { name: 'Alimentação', icon: '🍔', color: '#F59E0B' },
  { name: 'Transporte', icon: '🚗', color: '#3B82F6' },
  { name: 'Saúde', icon: '❤️', color: '#EF4444' },
  { name: 'Moradia', icon: '🏠', color: '#8B5CF6' },
  { name: 'Lazer', icon: '🎮', color: '#10B981' },
  { name: 'Educação', icon: '📚', color: '#F97316' },
  { name: 'Salário', icon: '💰', color: '#22C55E' },
  { name: 'Outros', icon: '📦', color: '#6B7280' },
]
```
