# Feature — Sistema de Transações

## Visão Geral

O sistema de transações é o núcleo financeiro do app. Ele alimenta diretamente o **saldo do mês** na tela Home, a **lista agrupada** na tela Transações e o **total de fatura** de cada cartão.

Atualmente os dados são mockados. Esta feature substitui os mocks por dados reais vindos da API.

---

## Contexto — O que já existe

### Schema no banco (`packages/db/schema/transactions.ts`)

```
transactions
├── id            uuid PK
├── userId        uuid FK → users.id (cascade delete)
├── categoryId    uuid FK → categories.id
├── cardId        uuid FK → cards.id (nullable)
├── title         varchar(200)
├── amount        numeric(12,2)
├── status        varchar(20)  → 'pending' | 'confirmed' | 'cancelled' (default: 'confirmed')
├── type          varchar(10)  → 'income' | 'expense'
├── date          date         → ISO: '2026-06-17'
├── notes         text (nullable)
├── isRecurring   boolean default false
└── createdAt     timestamp
```

### Padrão estabelecido pelos cartões (`cards.controller.ts`)

- `userId` sempre vem do JWT via `authMiddleware`, nunca do body
- Validação com Zod antes de qualquer query
- Resposta sempre `{ data }` no sucesso, `{ error, message }` no erro
- `asyncHandler` envolve todos os handlers
- Logs via `logRequestEvent` em cada etapa relevante

---

## Estrutura da API — O que será criado

```
apps/api/src/
├── controllers/
│   └── transactions.controller.ts   ← lógica de negócio
├── routes/
│   └── transactions.routes.ts       ← registro das rotas
```

Registrar em `apps/api/src/index.ts`:
```ts
app.use('/transactions', transactionsRouter)
```

---

## Rotas

### `GET /transactions`

Lista as transações do usuário autenticado, com filtro de mês obrigatório.

**Query params:**
| Param | Tipo | Obrigatório | Exemplo |
|---|---|---|---|
| `month` | `YYYY-MM` | sim | `2026-06` |

**Lógica interna:**
1. Extrai `userId` do JWT
2. Valida `month` com Zod (`/^\d{4}-\d{2}$/`)
3. Deriva `start = '2026-06-01'` e `end = '2026-07-01'`
4. Query: `WHERE userId = :id AND date >= start AND date < end`
5. Calcula `income`, `expense`, `balance` a partir dos resultados
6. Retorna lista + summary

**Resposta 200:**
```json
{
  "data": {
    "summary": {
      "income": 7000.00,
      "expense": 2693.97,
      "balance": 4306.03,
      "month": "2026-06"
    },
    "transactions": [
      {
        "id": "uuid",
        "title": "Salário — Brisanet",
        "amount": 5800.00,
        "type": "income",
        "categoryId": "uuid",
        "categoryName": "Receita",
        "categoryColor": "#3D8B4E",
        "cardId": null,
        "date": "2026-06-14",
        "notes": "Mensal",
        "isRecurring": false,
        "createdAt": "2026-06-14T10:00:00Z"
      }
    ]
  }
}
```

**Erros:**
| Status | Quando |
|---|---|
| `400` | `month` ausente ou formato inválido |
| `401` | Token ausente ou inválido |

---

### `POST /transactions`

Cria uma nova transação.

**Body:**
```json
{
  "title": "Mercado Pão de Açúcar",
  "amount": 312.47,
  "type": "expense",
  "categoryId": "uuid-da-categoria",
  "cardId": "uuid-do-cartao",
  "date": "2026-06-12",
  "notes": "",
  "isRecurring": false
}
```

**Validação Zod:**
- `title`: string, min 1
- `amount`: number, positive
- `type`: enum `['income', 'expense']`
- `categoryId`: uuid válido
- `cardId`: uuid válido ou null
- `date`: string formato `YYYY-MM-DD`
- `notes`: string opcional
- `isRecurring`: boolean, default false

**Resposta 201:**
```json
{
  "data": {
    "id": "uuid-gerado",
    "title": "Mercado Pão de Açúcar",
    "amount": 312.47,
    "type": "expense",
    "categoryId": "uuid",
    "cardId": "uuid",
    "date": "2026-06-12",
    "notes": "",
    "isRecurring": false,
    "createdAt": "2026-06-12T15:30:00Z"
  }
}
```

**Erros:**
| Status | Quando |
|---|---|
| `400` | Validação falhou |
| `401` | Não autenticado |
| `404` | `categoryId` não pertence ao usuário |

---

### `PUT /transactions/:id`

Atualiza uma transação existente. Todos os campos são opcionais (partial update).

**Regra:** só pode editar transação própria — verificar `userId` antes de atualizar.

**Resposta 200:** mesmo shape do POST.

**Erros:**
| Status | Quando |
|---|---|
| `400` | Validação falhou |
| `401` | Não autenticado |
| `404` | Transação não encontrada ou não pertence ao usuário |

---

### `DELETE /transactions/:id`

Remove uma transação.

**Regra:** só pode deletar transação própria.

**Resposta:** `204 No Content`

**Erros:**
| Status | Quando |
|---|---|
| `401` | Não autenticado |
| `404` | Não encontrada ou não pertence ao usuário |

---

## Contrato com o Frontend (Mobile)

### Tipo TypeScript gerado no mobile

```ts
// src/types/finance.ts — substituir o Transaction mock por este

export type Transaction = {
  id: string
  title: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  categoryName: string
  categoryColor: string
  cardId: string | null
  date: string          // ISO: '2026-06-14'
  notes: string | null
  isRecurring: boolean
  createdAt: string
}

export type MonthSummary = {
  income: number
  expense: number
  balance: number
  month: string         // 'YYYY-MM'
}

export type TransactionsResponse = {
  summary: MonthSummary
  transactions: Transaction[]
}
```

### Service no mobile

```ts
// src/services/transactions.service.ts

export async function getTransactions(month: string, token: string): Promise<TransactionsResponse>
export async function createTransaction(payload: CreateTransactionPayload, token: string): Promise<Transaction>
export async function updateTransaction(id: string, payload: Partial<CreateTransactionPayload>, token: string): Promise<Transaction>
export async function deleteTransaction(id: string, token: string): Promise<void>
```

### Hook React Query

```ts
// src/hooks/useTransactions.ts

export function useTransactions(month: string) {
  // queryKey: ['transactions', month]
  // enabled: !!token && !!month
  // retorna: { data, summary, isLoading, isError }
}
```

---

## Conexão com a Tela Home

A tela Home consome **dois valores** do sistema de transações:

### 1. Saldo do mês (Hero Card)

```
useTransactions(currentMonth)
  └── data.summary.income   → exibido no bloco "Receitas"
  └── data.summary.expense  → exibido no bloco "Despesas"
  └── data.summary.balance  → exibido como saldo principal
```

O `currentMonth` vem de `getCurrentMonth()` convertido para `YYYY-MM`:

```ts
// src/lib/date.ts — adicionar junto com getCurrentMonth()
export function getCurrentMonthParam(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`  // ex: '2026-06'
}
```

### 2. Últimas transações (lista na home)

```
useTransactions(currentMonth)
  └── data.transactions.slice(0, 5)  → lista "Últimas transações"
```

### 3. Sparkbars (gráfico de barras — 14 dias)

O `daily[]` atual vem do mock `SUMMARY.daily`. Com dados reais, será derivado das transações do mês agrupadas por dia — calculado no hook ou em utilitário em `src/lib/`.

---

## Conexão com a Tela de Cartões

O `currentMonthTotal` de cada cartão já é calculado na API em `GET /cards` (via query SQL que soma as transações do mês por cartão). Não há duplicação — os cartões já resolvem esse dado por conta própria.

A conexão ocorre pelo `cardId` na transação:
- Toda transação com `cardId` não-nulo contribui para a fatura do cartão correspondente
- Isso é calculado no backend em `cards.controller.ts → listCards`

---

## Ordem de Implementação

### Fase 1 — API (TDD com supertest)
1. Teste: `GET /transactions?month=2026-06` retorna 200 com summary + lista
2. Teste: `GET /transactions` sem `month` retorna 400
3. Teste: `POST /transactions` com body válido retorna 201
4. Teste: `POST /transactions` com body inválido retorna 400
5. Teste: `DELETE /transactions/:id` de outro usuário retorna 404
6. Implementar `transactions.controller.ts` e `transactions.routes.ts`

### Fase 2 — Mobile Service + Hook (TDD com jest)
1. Teste: `getTransactions` faz GET com Authorization e month corretos
2. Teste: `getTransactions` lança erro quando API retorna erro
3. Implementar `src/services/transactions.service.ts`
4. Implementar `src/hooks/useTransactions.ts`

### Fase 3 — Conectar na Home
1. Substituir `SUMMARY` por `useTransactions(getCurrentMonthParam())`
2. Substituir `TRANSACTIONS.slice(0, 5)` por `data.transactions.slice(0, 5)`
3. Adicionar estados de loading e error no Hero Card

### Fase 4 — Conectar na Tela de Transações
1. Substituir `TRANSACTIONS` por `useTransactions(month).data.transactions`
2. `totalIn` e `totalOut` passam a vir de `data.summary`

---

## Estados de UI que Precisam Existir

| Estado | Home | Transações |
|---|---|---|
| Loading | skeleton no Hero Card | skeleton na lista |
| Error | mensagem discreta + retry | mensagem + retry |
| Empty | "Nenhuma transação este mês" | empty state composto |
| Success | dados reais | lista agrupada por data |
