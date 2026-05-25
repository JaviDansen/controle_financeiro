# FinApp — Controle Financeiro Pessoal

Aplicativo mobile de controle financeiro pessoal para micro-empreendedores e usuários individuais. Monorepo com React Native (Expo), Node.js e PostgreSQL.

> **Versão 1.2 · Fase 1 — MVP** · Walber Vidigal · São Luís, MA, Brasil

**Links:**
[GitHub](https://github.com/JaviDansen/controle_financeiro) ·
[Frontend](https://financeiro.neryautoma.site) ·
[Kanban (Trello)](https://trello.com/invite/b/6a04828869137d9804bc5c37/ATTI141ef6b1134beaa4d6617762ff2f23e7ED535267/meu-quadro-do-trello)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura do Monorepo](#3-estrutura-do-monorepo)
4. [Módulos da Fase 1](#4-módulos-da-fase-1)
5. [Schema do Banco de Dados](#5-schema-do-banco-de-dados)
6. [Ambiente de Testes](#6-ambiente-de-testes)
7. [Integrações com Google Workspace](#7-integrações-com-google-workspace)
8. [Ambiente de Agentes (Claude Code)](#8-ambiente-de-agentes-claude-code)
9. [Variáveis de Ambiente](#9-variáveis-de-ambiente)
10. [Setup e Instalação](#10-setup-e-instalação)
11. [Roadmap](#11-roadmap)

---

## 1. Visão Geral

O FinApp é um aplicativo mobile de controle financeiro pessoal construído em fases incrementais, partindo de controle manual e evoluindo para automações, OCR, inteligência artificial e integrações externas.

### 1.1 Roadmap de Fases

| Fase | Nome | Foco principal | Status |
|---|---|---|---|
| Fase 1 | Controle Financeiro Manual | Receitas, despesas, cartões, metas, gráficos | **MVP** |
| Fase 2 | Automações | Categorização automática, alertas, previsões, recorrências | Planejado |
| Fase 3 | OCR + IA | Leitura de extratos, comprovantes, importação automática | Planejado |
| Fase 4 | Assistente Financeiro IA | Perguntas em linguagem natural sobre finanças | Planejado |
| Fase 5 | Integrações Externas | Uber, iFood, Steam — após validação do produto | Futuro |

### 1.2 Escopo do MVP

- Autenticação (Login / Registro / Recuperação de senha)
- Dashboard Home com resumo financeiro e gráficos
- Gerenciamento de Transações (receitas e despesas)
- Gerenciamento de Cartões (crédito e débito)
- Gerenciamento de Metas financeiras
- Perfil do usuário

### 1.3 Estado atual da Fase 1

| Módulo | Status |
|---|---|
| Monorepo e estrutura base | ✅ Concluído |
| Schema do banco (5 tabelas) | ✅ Concluído |
| API Express + health endpoint | ✅ Concluído |
| Verificação de conexão ao banco no startup | ✅ Concluído |
| Integração Google Docs/Drive | ✅ Concluído |
| Ambiente de agentes Claude Code | ✅ Concluído |
| Ambiente de testes da API (Jest + Supertest) | ✅ Concluído |
| `POST /auth/register` | ✅ Concluído |
| Testes TDD mobile (infraestrutura + 33 testes red) | ✅ Concluído |
| Schema de cartões expandido — Migration 0003 | ✅ Concluído |
| Testes TDD da API para `/cards` (15 cenários) | ✅ Concluído |
| Mobile — service, hook e tela de cartões conectada | ✅ Concluído |
| `POST /auth/login` | 🔲 Planejado |
| `POST /auth/forgot-password` | 🔲 Planejado |
| Telas mobile de autenticação | 🔲 Planejado |
| Módulo de Transações | 🔲 Planejado |
| Módulo de Cartões — implementação da API | 🔧 Testes prontos, aguardando controller |
| Módulo de Metas | 🔲 Planejado |
| Dashboard Home | 🔲 Planejado |

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão | Função |
|---|---|---|---|
| Mobile | React Native + Expo | SDK 54 | Interface do usuário via Expo Go |
| Navegação | Expo Router | ~6.0.0 | File-based routing |
| Estilização | NativeWind | ^4.1.23 | Classes Tailwind no React Native |
| Estado global | Zustand | ^5.0.0 | Gerenciamento de estado leve |
| Cache / Fetch | React Query (TanStack) | ^5.40.0 | Cache, loading states, refetch |
| Backend | Node.js + TypeScript + Express | 24.15.0 / ^4.19.2 | API REST — deploy na Railway |
| Validação | Zod | ^3.23.8 | Validação de entrada nas rotas |
| Autenticação | JWT + bcrypt | ^9 / ^2 | Tokens de autenticação |
| ORM | Drizzle ORM + Drizzle Kit | ^0.31.2 | Queries tipadas e migrations |
| Banco de dados | PostgreSQL (VPS própria) | — | Self-hosted, sem free tier limitado |
| Deploy | Vercel + Railway + VPS | — | Custo zero até validação |
| Integração docs | googleapis | ^171.4.0 | Sincronização automática de documentação |

### Justificativas técnicas

**Por que Expo Go e não bare React Native?**
Elimina a configuração de ambiente nativo (Android Studio, Xcode). Teste direto no celular via QR code. Migração para EAS Build é direta quando necessário publicar nas lojas.

**Por que Drizzle ORM e não TypeORM?**
O schema é definido em TypeScript puro — tipos inferidos automaticamente sem decorators. Drizzle Studio fornece interface gráfica local sem ferramentas externas.

**Por que VPS própria e não Neon/PlanetScale?**
Elimina dependência de free tiers limitados. Banco em `console.neryautoma.site:9567` com acesso total e sem restrições de conexões ou armazenamento.

**Por que monorepo?**
O pacote `packages/db` é importado tanto pela API quanto pelo mobile, garantindo que os tipos das tabelas (`User`, `Transaction`, `Card`, `Goal`) estejam sempre em sincronia sem duplicação.

---

## 3. Estrutura do Monorepo

```
controle-financeiro/
├── apps/
│   ├── mobile/                        # React Native + Expo SDK 54
│   │   ├── app/
│   │   │   ├── (auth)/                # Telas de login, registro e recuperação
│   │   │   └── (tabs)/                # Telas principais com navegação por abas
│   │   ├── components/                # Componentes reutilizáveis
│   │   ├── hooks/                     # Custom hooks (useTransactions, useGoals...)
│   │   ├── store/                     # Stores Zustand
│   │   ├── services/                  # Funções de chamada à API
│   │   └── __tests__/                 # Testes TDD do mobile (jest-expo)
│   │       └── helpers/               # render.tsx com QueryClient wrapper
│   └── api/                           # Node.js + Express + TypeScript
│       ├── src/
│       │   ├── index.ts               # Entry point — Express, CORS, health, DB check
│       │   ├── routes/                # Rotas da API REST
│       │   ├── controllers/           # Lógica de negócio por módulo
│       │   ├── middlewares/           # Auth JWT, validação, erros
│       │   └── services/              # Integrações (Google Auth, Docs)
│       ├── tests/                     # Testes da API (Jest + ts-jest + Supertest)
│       │   └── helpers/               # global-setup, db, app, setup-env
│       └── requests/                  # Arquivos .http (REST Client — VS Code)
├── packages/
│   └── db/                            # Schema Drizzle compartilhado
│       ├── schema/                    # Definição das tabelas em TypeScript
│       └── migrations/                # Geradas pelo Drizzle Kit — nunca editar
├── .claude/
│   └── skills/                        # Skills do agente Claude Code
├── base_knowledge/
│   ├── tasks/                         # Histórico visual de implementações
│   └── technical/                     # Documentação técnica local
├── .env                               # Variáveis de ambiente (nunca commitar)
├── .env.example                       # Template de variáveis
├── .mcp.json                          # Configuração dos servidores MCP (Trello)
└── .nvmrc                             # Versão do Node.js (24.15.0)
```

---

## 4. Módulos da Fase 1

### 4.1 Autenticação

Ponto de entrada do aplicativo. Gerencia o ciclo completo de autenticação.

**Fluxo técnico:**
1. Formulário validado por Zod no mobile
2. `POST /auth/login` para a API
3. API valida com bcrypt, gera JWT
4. Token armazenado em SecureStore do Expo + Zustand
5. React Query invalida cache e redireciona para Home

**Endpoints:**

| Método | Rota | Descrição | Status |
|---|---|---|---|
| POST | `/auth/register` | Cria novo usuário | ✅ Implementado |
| POST | `/auth/login` | Autentica e retorna JWT | 🔲 Planejado |
| POST | `/auth/logout` | Invalida sessão | 🔲 Planejado |
| POST | `/auth/forgot-password` | Envia e-mail de recuperação | 🔲 Planejado |
| POST | `/auth/reset-password` | Redefine senha com token | 🔲 Planejado |

---

### 4.2 Dashboard Home

Tela principal. Exibe resumo financeiro do período atual com acesso rápido às funcionalidades.

**Componentes da interface:**

1. **Card de Saldo do Mês** — receitas, despesas e saldo líquido com indicador visual (verde/vermelho)
2. **Últimas Transações** — 5 transações mais recentes com link "Ver todas"
3. **Resumo de Parcelamentos dos Cartões** — fatura e parcelas abertas por cartão de crédito
4. **FAB** — botão flutuante para registrar nova transação

**Dados carregados:**

| Dado | Endpoint | Cache |
|---|---|---|
| Resumo mensal (receitas, despesas, saldo) | `GET /dashboard/summary` | 5 min |
| Últimas transações | `GET /transactions?limit=5` | 2 min |
| Resumo de parcelamentos por cartão | `GET /dashboard/cards-summary` | 5 min |
| Dados do usuário | `GET /users/me` | 30 min |

**Endpoint `GET /dashboard/cards-summary`:**

Retorna, por cartão de crédito, o total da fatura do mês e as parcelas em aberto.

```json
{
  "data": [
    {
      "card_id": "uuid",
      "card_name": "Nubank",
      "current_month_total": 1240.00,
      "open_installments_count": 4,
      "open_installments_total": 3200.00,
      "closing_day": 16,
      "best_purchase_day": 19
    }
  ]
}
```

---

### 4.3 Transações

Módulo central do MVP. Gerenciamento completo de receitas e despesas.

**Campos:**

| Campo | Tipo | Obrigatório | Observação |
|---|---|---|---|
| `title` | string | Sim | Descrição da transação |
| `amount` | numeric(12,2) | Sim | Valor sempre positivo |
| `type` | enum | Sim | `'income'` ou `'expense'` |
| `category_id` | uuid FK | Sim | Categoria da transação |
| `card_id` | uuid FK | Não | Cartão utilizado (opcional) |
| `date` | date | Sim | Data da transação |
| `notes` | text | Não | Observações livres |
| `is_recurring` | boolean | Sim | Flag de recorrência (Fase 2) |

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/transactions` | Lista com filtros e paginação |
| POST | `/transactions` | Cria nova transação |
| GET | `/transactions/:id` | Retorna por ID |
| PATCH | `/transactions/:id` | Atualiza transação |
| DELETE | `/transactions/:id` | Remove transação |
| GET | `/transactions/summary` | Totais por tipo e categoria |

---

### 4.4 Cartões

Cadastro e acompanhamento de cartões de crédito e débito.

**Campos:**

| Campo | Tipo | Observação |
|---|---|---|
| `name` | string | Nome do cartão (ex: Nubank) |
| `bank` | string | Nome do banco emissor |
| `type` | enum | `'credit'` ou `'debit'` |
| `last_four` | string(4) | Últimos 4 dígitos |
| `holder` | string | Nome do titular impresso no cartão |
| `expiry` | string | Validade no formato `MM/YY` |
| `credit_limit` | numeric(12,2) | Limite (só crédito) |
| `closing_day` | int | Dia de fechamento da fatura (1–28) |
| `due_day` | int | Dia de vencimento |
| `gradient_from` | string | Cor primária do gradiente (hex) — coluna `color` no banco |
| `gradient_to` | string | Cor secundária do gradiente (hex) |
| `accent` | string | Cor de destaque do cartão (hex) |
| `best_purchase_day` | int | **Virtual** — calculado pelo backend, não persiste no banco |

**Lógica de cálculo — `best_purchase_day`:**

O melhor dia de compra é calculado com base no `closing_day`, respeitando dias úteis:

1. Verificar se `closing_day` cai em fim de semana
2. Se sim, avançar para a próxima segunda-feira
3. Somar 1 dia ao resultado

```
closing_day = 16 (sábado)
→ próximo dia útil = 18 (segunda-feira)
→ best_purchase_day = 19
```

`best_purchase_day` é retornado pela API no momento da resposta — não é armazenado no banco.

**Endpoints:**

| Método | Rota | Descrição |
|---|---|---|
| GET | `/cards` | Lista todos os cartões do usuário |
| POST | `/cards` | Cadastra novo cartão |
| GET | `/cards/:id` | Retorna cartão por ID com `best_purchase_day` |
| PATCH | `/cards/:id` | Atualiza dados do cartão |
| DELETE | `/cards/:id` | Remove cartão |

---

### 4.5 Metas

Objetivos financeiros com valor alvo, prazo e acompanhamento de progresso.

| Campo | Tipo | Observação |
|---|---|---|
| `title` | string | Nome da meta |
| `target_amount` | numeric(12,2) | Valor a atingir |
| `current_amount` | numeric(12,2) | Valor acumulado |
| `deadline` | date | Data limite (opcional) |
| `category` | string | Categoria visual |
| `is_active` | boolean | Em andamento ou concluída |

---

## 5. Schema do Banco de Dados

Banco: PostgreSQL self-hosted · `console.neryautoma.site:9567`

Todas as tabelas usam UUID como PK e registram `created_at` / `updated_at` automaticamente.

### Tabelas e relacionamentos

| Tabela | Relações |
|---|---|
| `users` | — |
| `categories` | belongs to `users` |
| `cards` | belongs to `users` |
| `transactions` | belongs to `users`, `categories`, `cards` |
| `goals` | belongs to `users` |

### Campos — `users`

| Coluna | Tipo | Restrição |
|---|---|---|
| `id` | uuid | PK, `defaultRandom()` |
| `name` | varchar(100) | NOT NULL |
| `email` | varchar(255) | NOT NULL, UNIQUE |
| `password_hash` | text | NOT NULL |
| `created_at` | timestamp | NOT NULL, `defaultNow()` |
| `updated_at` | timestamp | NOT NULL, `defaultNow()` |

### Campos — `transactions`

| Coluna | Tipo | Restrição |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `users.id`, cascade delete |
| `category_id` | uuid | FK → `categories.id` |
| `card_id` | uuid | FK → `cards.id`, NULLABLE |
| `title` | varchar(200) | NOT NULL |
| `amount` | numeric(12,2) | NOT NULL |
| `type` | varchar(10) | `'income'` \| `'expense'` |
| `date` | date | NOT NULL |
| `notes` | text | NULLABLE |
| `is_recurring` | boolean | default `false` |
| `created_at` | timestamp | NOT NULL |

### Comandos

```bash
npm run db:generate   # Gera migrations após alterar schema
npm run migrations    # Aplica na VPS PostgreSQL
npm run db:studio     # Abre Drizzle Studio local
```

---

## 6. Ambiente de Testes

O projeto segue **TDD (Test-Driven Development)**: testes escritos antes da implementação, nunca alterados para o código passar.

### 6.1 API — Jest + ts-jest + Supertest

```bash
# Da raiz
npm test              # Roda todos os testes da API
npm run test:watch    # Modo watch

# Ou diretamente
cd apps/api && npm test
```

**Estrutura:**

```
apps/api/
├── tests/
│   ├── helpers/
│   │   ├── global-setup.ts    # Carrega .env antes dos testes
│   │   ├── setup-env.ts       # Sobrescreve DATABASE_URL com DATABASE_URL_TEST nos workers
│   │   ├── db.ts              # testDb + clearTables()
│   │   └── app.ts             # api() com supertest
│   ├── auth_integration_test.ts        # 21 testes de /auth/*
│   ├── api_health_integration_test.ts  # 5 testes de /health e /hello
│   ├── database_migration_integration_test.ts  # 6 testes de migrations
│   ├── connection_unit_test.ts         # 9 testes de buildConnectionString
│   ├── schema_unit_test.ts             # 11 testes de estrutura Drizzle
│   └── cards_integration_test.ts       # 15 testes de GET /cards e POST /cards
└── jest.config.js                      # maxWorkers: 1 para evitar conflito de FK
```

**Pré-requisito:** `DATABASE_URL_TEST` no `.env` apontando para um banco PostgreSQL separado e isolado.

**Estado atual dos testes da API:**

| Grupo | Testes | Status |
|---|---|---|
| `POST /auth/register` | 9/9 | ✅ Passando |
| Health / Hello | 5/5 | ✅ Passando |
| Schema Drizzle | 11/11 | ✅ Passando |
| Connection string | 9/9 | ✅ Passando |
| Migrations | 6/6 | ✅ Passando |
| `GET /cards` + `POST /cards` | 15/15 | ✅ Escritos (⏳ Red — implementação pendente) |
| `POST /auth/login` | 0/9 | ⏳ Red (não implementado) |
| `POST /auth/forgot-password` | 0/4 | ⏳ Red (não implementado) |

### 6.2 Mobile — jest-expo + Testing Library

```bash
# Da raiz
npm run test:mobile         # Roda todos os testes do mobile
npm run test:mobile:watch   # Modo watch

# Ou diretamente
cd apps/mobile && npm test
```

**Estrutura:**

```
apps/mobile/
├── __tests__/
│   ├── helpers/
│   │   └── render.tsx              # renderWithProviders (QueryClient wrapper)
│   ├── auth.store.test.ts          # 10 testes do Zustand store
│   ├── login.test.tsx              # 6 testes da tela de login
│   ├── register.test.tsx           # 12 testes da tela de registro
│   ├── forgot-password.test.tsx    # 5 testes da tela de recuperação
│   └── cards.service.test.ts       # 7 testes de getCards e createCard (GREEN)
└── jest.config.js
```

**Estado atual dos testes do mobile:**
- `cards.service.test.ts` — 7/7 ✅ Passando
- Demais 33 testes — ⏳ Red — aguardando implementação das telas, store e services de autenticação

### 6.3 Arquivos `.http` (REST Client)

Alternativa ao Postman integrada ao VS Code (extensão REST Client):

```
apps/api/requests/
├── health.http   # GET /health, GET /hello
└── auth.http     # 16 requisições cobrindo todos os casos de /auth/*
```

---

## 7. Integrações com Google Workspace

Integração com Google Drive e Google Docs via service account para manter a documentação técnica sincronizada com o código.

### Serviços implementados

| Arquivo | Função |
|---|---|
| `apps/api/src/services/google-auth.service.ts` | Singleton de autenticação via service account |
| `apps/api/src/services/docs.service.ts` | `findDocumentId`, `exportDocument`, `replaceDocumentContent`, `appendToDocument`, `replaceSection` |

### Scripts de sincronização

```bash
# Baixa o Google Doc para base_knowledge/technical/
npx ts-node apps/api/src/scripts/export-doc.ts

# Envia o arquivo local de volta ao Google Doc
npx ts-node apps/api/src/scripts/update-doc.ts
```

A service account `revisador-documentacao-projeto@financeiro-nerydansen.iam.gserviceaccount.com` deve ter permissão de **Editor** no documento `OFFICIAL-FinApp_Documentacao_Tecnica` no Google Drive.

---

## 8. Ambiente de Agentes (Claude Code)

O projeto usa [Claude Code](https://claude.ai/code) como agente de desenvolvimento. Configurações em `.claude/settings.json`.

### Skills disponíveis

| Comando | O que faz |
|---|---|
| `/nova-rota <módulo>` | Cria route + controller com JWT, Zod e Drizzle |
| `/nova-tela <nome> <grupo>` | Cria tela Expo + hook React Query + service |
| `/novo-schema <tabela>` | Adiciona tabela ao Drizzle com tipos inferidos |
| `/migrar-db` | Gera migration, revisa e aplica na VPS |
| `/atualizar-tasks` | Atualiza `base_knowledge/tasks.html` |
| `/fazer-commit` | Delega commit ao agente `commit-writer` |
| `/doc-technical-reviewer` | Sincroniza documentação técnica com o README |

### MCP do Trello

Servidor MCP configurado em `.mcp.json`. Permite ao agente interagir com o Kanban durante o desenvolvimento.

### Regras obrigatórias do projeto

- **Nunca** executar `git commit` diretamente — sempre acionar `commit-writer`
- Commits sempre em português brasileiro, `[TYPE]` em inglês
- **TDD obrigatório** — testes escritos antes da implementação, nunca alterados para o código passar
- **Nunca** usar `StyleSheet.create` no mobile — sempre NativeWind
- **Nunca** retornar `passwordHash` em nenhum endpoint
- `userId` sempre vem do JWT, nunca do body ou query string
- **Nunca** duplicar tipos — importar sempre de `@finapp/db`

---

## 9. Variáveis de Ambiente

Crie `.env` na raiz com base no `.env.example`. **Nunca commitar o `.env`.**

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim* | Connection string completa de produção (tem prioridade) |
| `DATABASE_HOST` | Sim* | Host da VPS PostgreSQL |
| `DATABASE_PORT` | Sim* | Porta (padrão: 5432) |
| `DATABASE_USER` | Sim* | Usuário do banco |
| `DATABASE_PASSWORD` | Sim* | Senha do banco |
| `DATABASE_NAME` | Sim* | Nome do banco de produção |
| `DATABASE_URL_TEST` | Não | Connection string do banco isolado para testes; usada somente quando `DATABASE_URL` e os parâmetros individuais não existem |
| `DATABASE_TEST_HOST` | Não | Host do banco de teste |
| `DATABASE_TEST_PORT` | Não | Porta do banco de teste (padrão: 5432) |
| `DATABASE_TEST_USER` | Não | Usuário do banco de teste |
| `DATABASE_TEST_PASSWORD` | Não | Senha do banco de teste |
| `DATABASE_TEST_NAME` | Não | Nome do banco de teste |
| `JWT_SECRET` | Sim | Chave secreta longa para assinar tokens |
| `PORT` | Não | Porta da API (padrão: 3000) |
| `API_URL` | Não | URL base da API usada pelo mobile |
| `TRELLO_API_KEY` | Não | API key do Trello (MCP) |
| `TRELLO_TOKEN` | Não | Token de acesso do Trello (MCP) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Não | JSON da service account (minificado, uma linha) |

> \* Ordem de prioridade: `DATABASE_URL` -> parâmetros individuais de produção -> `DATABASE_URL_TEST` -> parâmetros individuais de teste.

---

## 10. Setup e Instalação

### Pré-requisitos

- Node.js `24.15.0` (use `nvm use` na raiz — `.nvmrc` já configurado)
- Git
- Expo Go no celular (Play Store / App Store)
- Acesso à VPS com PostgreSQL configurado
- Conta no [Railway](https://railway.app) (deploy da API)

### Extensões recomendadas (VS Code)

- **ESLint** — lint em tempo real
- **Prettier** — formatação automática
- **REST Client** — executa arquivos `.http` diretamente no editor
- **Drizzle ORM** — syntax highlight no schema
- **Expo Tools** — suporte ao Expo Router
- **GitLens** — histórico de git inline

### Instalação

```bash
git clone https://github.com/JaviDansen/controle_financeiro
cd controle-financeiro
npm install
```

### Rodar localmente

```bash
# Backend (porta 3000)
npm run api

# Mobile — escaneie o QR com Expo Go
npm run mobile
```

### Banco de dados

```bash
npm run db:generate   # Gera migrations após alterar schema
npm run migrations    # Aplica na VPS
npm run db:studio     # Abre Drizzle Studio (GUI local)
```

### Testes

```bash
# API
npm test                    # Todos os testes da API
npm run test:watch          # Modo watch

# Mobile
npm run test:mobile         # Todos os testes do mobile
npm run test:mobile:watch   # Modo watch
```

### Deploy na Railway

1. Acesse [railway.app](https://railway.app) e crie conta com GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Root directory: `apps/api`
4. Em **Variables**, adicione todas as variáveis do `.env`
5. A Railway detecta Node.js automaticamente e faz o build
6. Anote a URL pública gerada — será usada como `API_URL` no mobile

---

## 11. Roadmap

| Fase | Nome | Foco | Status |
|---|---|---|---|
| Fase 1 | Controle Financeiro Manual | Receitas, despesas, cartões, metas, gráficos | **MVP** |
| Fase 2 | Automações | Categorização automática, alertas, recorrências | Planejado |
| Fase 3 | OCR + IA | Leitura de extratos e comprovantes | Planejado |
| Fase 4 | Assistente Financeiro IA | Perguntas em linguagem natural | Planejado |
| Fase 5 | Integrações Externas | Uber, iFood, Steam | Futuro |

---

*FinApp · Documentação Técnica v1.3 · Atualizado em 19 mai 2026*
