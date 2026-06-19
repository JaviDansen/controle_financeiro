# Feature — Perfil Financeiro por Origem

**Status:** Planejado
**Prioridade:** Alta
**Contexto originador:** Hoje o app separa parcialmente gastos por cartão, mas ainda não permite que o usuário organize sua vida financeira por origem real do dinheiro. A necessidade é enxergar e configurar gastos distintos para Caixa, Banco do Brasil, contas de investimento e outras carteiras.

---

## Sistema Atual (como funciona hoje)

### Banco de dados

**Arquivo:** `packages/db/schema/transactions.ts`

- A tabela `transactions` guarda:
  - `userId`
  - `categoryId`
  - `cardId` opcional
  - `title`
  - `amount`
  - `type`
  - `date`
  - `notes`
  - `isRecurring`
- Hoje uma transação pode estar ligada a um cartão, mas não a uma conta, banco, carteira ou origem financeira dedicada.

**Arquivo:** `packages/db/schema/cards.ts`

- A tabela `cards` já possui:
  - `name`
  - `bank`
  - `type`
  - metadados de limite, vencimento e visual
- O campo `bank` é apenas texto livre. Ele ajuda a exibir o emissor do cartão, mas não representa uma origem financeira reutilizável no sistema.

**Arquivo:** `packages/db/schema/users.ts`

- A tabela `users` guarda apenas identidade e autenticação:
  - `name`
  - `email`
  - `passwordHash`
  - `googleId`
- Não existe hoje nenhuma estrutura de preferências financeiras, contas ou perfis de origem ligados ao usuário.

### Mobile

**Arquivo:** `apps/mobile/app/(tabs)/profile.tsx`

- A tela `Perfil` mostra apenas:
  - avatar
  - e-mail
  - alterar senha
  - notificações
  - cartões
  - exportar transações
  - sair da conta
- Ainda não existe bloco de "contas", "bancos", "origens" ou "alocação de gastos".

**Arquivo:** `apps/mobile/src/types/finance.ts`

- O tipo `Transaction` do mobile contém `card`, mas não contém:
  - `accountId`
  - `sourceId`
  - `institution`
  - `portfolio`

### Backend

- O backend implementado em `apps/api/src` hoje está concentrado em autenticação e cartões.
- Não existe no código atual um módulo de contas bancárias, perfil financeiro ou transações por origem.
- O `README.md` descreve endpoints mais amplos de transações e dashboard, mas o código presente hoje ainda não expõe esse módulo em `apps/api/src`.

---

## Problema

Hoje o usuário até consegue diferenciar parte dos gastos quando eles passam por um cartão, mas não consegue estruturar o financeiro por origem real do patrimônio. Isso impede cenários comuns como separar gastos da Caixa, Banco do Brasil, carteira de investimentos, conta PJ, conta pessoal ou saldo em dinheiro.

---

## Solução Proposta

Criar uma feature de **Perfis Financeiros por Origem** dentro da área de perfil do usuário.

A ideia é introduzir uma nova entidade de domínio chamada **financial source** que represente qualquer origem relevante para o controle financeiro:

- conta corrente
- conta poupança
- banco digital
- carteira em dinheiro
- conta investimento
- reserva
- cartão sem conta vinculada

Cada usuário poderá cadastrar várias origens, por exemplo:

- Caixa
- Banco do Brasil
- Nubank
- Inter Invest
- Carteira física
- Corretora XP

Essas origens passam a ser reutilizadas em duas frentes:

1. **Configuração no Perfil**
   - o usuário cria, nomeia, organiza e personaliza suas origens financeiras
   - pode marcar uma origem como investimento
   - pode definir meta de gasto mensal por origem

2. **Classificação de transações**
   - cada transação passa a poder apontar para uma origem financeira
   - cartões podem opcionalmente ficar vinculados a uma origem
   - relatórios e filtros conseguem responder "quanto saiu da Caixa?", "quanto foi investimento?", "quanto gastei no Banco do Brasil este mês?"

### Abordagem escolhida

Modelar origens em tabela própria, e não dentro de `users` nem apenas como string em `transactions`.

### Alternativas descartadas

1. **Usar só o campo `cards.bank`**
   - não cobre despesas sem cartão
   - não cobre investimentos
   - não permite configuração de metas por origem
   - mantém tudo dependente de texto livre

2. **Adicionar campos soltos em `users`**
   - mistura identidade com domínio financeiro
   - dificulta expansão futura
   - vai contra o padrão de criar entidade dedicada para novo estado do sistema

3. **Adicionar apenas `bankName` em `transactions`**
   - gera duplicação
   - dificulta filtros consistentes
   - não permite reaproveitamento entre cartões, perfil e relatórios

---

## Banco de dados

### Nova tabela: `financial_sources`

```sql
CREATE TABLE "financial_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "institution" varchar(120),
  "kind" varchar(20) NOT NULL,
  "color" varchar(7),
  "icon" varchar(40),
  "monthly_budget" numeric(12,2),
  "include_in_balance" boolean NOT NULL DEFAULT true,
  "display_order" integer NOT NULL DEFAULT 0,
  "is_archived" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "financial_sources_user_id_idx"
  ON "financial_sources" ("user_id");

CREATE INDEX "financial_sources_user_kind_idx"
  ON "financial_sources" ("user_id", "kind");

ALTER TABLE "financial_sources"
  ADD CONSTRAINT "financial_sources_kind_check"
  CHECK ("kind" IN ('checking', 'savings', 'investment', 'cash', 'credit', 'other'));
```

### Alteração em `transactions`

```sql
ALTER TABLE "transactions"
  ADD COLUMN "financial_source_id" uuid
  REFERENCES "financial_sources"("id")
  ON DELETE SET NULL;

CREATE INDEX "transactions_financial_source_id_idx"
  ON "transactions" ("financial_source_id");
```

### Alteração em `cards`

```sql
ALTER TABLE "cards"
  ADD COLUMN "financial_source_id" uuid
  REFERENCES "financial_sources"("id")
  ON DELETE SET NULL;

CREATE INDEX "cards_financial_source_id_idx"
  ON "cards" ("financial_source_id");
```

### Backfill inicial sugerido

- criar uma origem por banco já detectado em `cards.bank`
- vincular automaticamente os cartões existentes à origem equivalente
- deixar `transactions.financial_source_id` nulo nas transações antigas até migração assistida

---

## Backend

### Novos arquivos

```text
apps/api/src/controllers/financial-sources.controller.ts
apps/api/src/routes/financial-sources.routes.ts
```

### Arquivos atualizados

```text
apps/api/src/index.ts
packages/db/schema/transactions.ts
packages/db/schema/cards.ts
packages/db/src/index.ts
```

### Rotas propostas

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/financial-sources` | Listar origens do usuário |
| `POST` | `/financial-sources` | Criar origem |
| `PATCH` | `/financial-sources/:id` | Editar nome, cor, tipo, meta |
| `DELETE` | `/financial-sources/:id` | Arquivar origem |
| `GET` | `/financial-sources/summary?month=YYYY-MM` | Resumir gastos e receitas por origem |

### Regras de negócio

1. `userId` sempre vem do JWT, no mesmo padrão já usado em cartões.
2. Não permitir editar origem de outro usuário.
3. Não apagar fisicamente uma origem já usada em transações; arquivar é mais seguro.
4. Se um cartão estiver vinculado a uma origem, o formulário de transação pode sugerir essa origem automaticamente.
5. Para transações de investimento, permitir `kind = investment` e destacar esse agrupamento nos relatórios.

### Validações principais

- `name`: obrigatório, mínimo 2 caracteres
- `kind`: enum controlado
- `monthlyBudget`: opcional, valor positivo
- `financialSourceId`: UUID válido e pertencente ao usuário autenticado

---

## Fluxo completo (ponta a ponta)

### Criar uma origem nova no perfil

1. Usuário abre `Perfil`
2. Toca em `Origens financeiras`
3. Preenche:
   - nome: `Caixa`
   - tipo: `checking`
   - meta mensal: `1500`
4. Mobile envia `POST /financial-sources`
5. Backend valida o JWT
6. Backend valida o body
7. Backend salva a origem no banco com `userId` do token
8. Backend retorna `{ data }`
9. Mobile atualiza a lista da seção de perfil

### Classificar uma transação por origem

1. Usuário cria ou edita transação
2. Seleciona origem: `Banco do Brasil`
3. Mobile envia `financialSourceId`
4. Backend valida se a origem pertence ao usuário
5. Transação é salva com esse vínculo
6. Relatórios mensais passam a agregar esse valor na origem correta

### Cartão herdando origem

1. Usuário vincula cartão `Visa Ourocard` à origem `Banco do Brasil`
2. Em nova transação com esse cartão, o app sugere automaticamente `Banco do Brasil`
3. Usuário pode confirmar ou trocar, se necessário

---

## Frontend

### Perfil

**Arquivo atual tocado no futuro:** `apps/mobile/app/(tabs)/profile.tsx`

Adicionar nova seção:

- `Origens financeiras`
- `Metas por origem`
- `Investimentos`

### Novas telas sugeridas

```text
apps/mobile/app/profile/financial-sources.tsx
apps/mobile/app/profile/financial-source-form.tsx
apps/mobile/app/profile/financial-source-summary.tsx
```

### UX proposta

1. A tela de perfil deixa de ser apenas conta/sessão e passa a ser também central de organização financeira.
2. Cada origem aparece como card compacto com:
   - nome
   - instituição
   - tipo
   - gasto do mês
   - meta do mês
3. Investimentos devem aparecer em grupo separado para não confundir gasto operacional com alocação patrimonial.
4. O usuário deve conseguir reordenar as origens mais importantes.

### Ajustes futuros no fluxo de transações

- No formulário de transação, incluir seletor de origem financeira.
- Se houver `cardId`, pré-preencher a origem vinculada ao cartão.
- Permitir filtro por origem na listagem de transações.

---

## Decisões de Design Registradas

| Decisão | Escolha | Motivo |
|---|---|---|
| Nova entidade principal | `financial_sources` | Resolve conta, banco, investimento e carteira em um modelo único |
| Onde a feature nasce | Tela `Perfil` | É o lugar natural para o usuário configurar sua estrutura financeira |
| Como ligar transações | `transactions.financial_source_id` | Permite relatório por origem sem depender só de cartão |
| Como ligar cartões | `cards.financial_source_id` opcional | Ajuda autofill e consistência entre cartão e banco |
| Exclusão | Arquivamento lógico | Evita quebrar histórico |
| Investimentos | `kind = investment` | Separa patrimônio de gasto corrente |

---

## A partir daqui, o que podemos melhorar?

### Fase 1 — Estrutura mínima útil

- cadastrar origens financeiras no perfil
- vincular cartão a origem
- vincular transação a origem
- filtrar transações por origem
- mostrar resumo mensal por origem

### Fase 2 — Inteligência de uso

- sugerir origem automaticamente com base no cartão usado
- sugerir origem com base em padrões de título da transação
- destacar origem mais usada do mês
- alertar quando uma origem ultrapassar a meta mensal

### Fase 3 — Gestão financeira mais forte

- separar origem pessoal x profissional
- criar regra para transferências entre origens sem contar como gasto real
- permitir saldo inicial por origem
- acompanhar evolução patrimonial por origem
- consolidar investimentos à parte do fluxo de despesas

### Fase 4 — Relatórios melhores

- gráfico por banco/origem
- comparação mensal por origem
- top 5 categorias dentro de cada banco
- gastos recorrentes por origem
- concentração de despesas em um único banco

### Melhorias de produto que fazem bastante sentido

1. **Transferência entre contas**
   - Exemplo: saiu da Caixa e entrou no Banco do Brasil
   - Isso deve ser tratado como movimentação interna, não como despesa

2. **Saldo por origem**
   - O usuário consegue ver quanto tem em cada conta/carteira
   - Essencial para transformar o perfil em painel financeiro real

3. **Modo investimento**
   - Permite marcar origem como investimento
   - Exibe aportes, resgates e patrimônio sem misturar com consumo

4. **Metas por origem**
   - Exemplo: limitar gastos da conta da Caixa em R$ 1.500/mês
   - Útil para disciplina financeira operacional

5. **Agrupamento por instituição**
   - Exemplo: dois cartões e uma conta vinculados ao Banco do Brasil
   - O usuário enxerga instituição e produtos em camadas separadas

---

## Checklist de implementação

- [ ] Migration criada e testada
- [ ] Schema Drizzle atualizado para `financial_sources`
- [ ] `transactions` atualizada com `financialSourceId`
- [ ] `cards` atualizada com `financialSourceId`
- [ ] Controller e rotas de `financial-sources`
- [ ] Resumo mensal por origem
- [ ] UI de perfil para listar e cadastrar origens
- [ ] Formulário de transação com seletor de origem
- [ ] Backfill inicial para bancos já existentes nos cartões
- [ ] Testes dos casos principais
- [ ] Log estruturado nos pontos críticos
