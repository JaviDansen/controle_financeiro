# FinApp — Controle Financeiro Pessoal

Aplicativo mobile de controle financeiro pessoal para micro-empreendedores e usuários individuais. Monorepo com React Native (Expo), Node.js e PostgreSQL.

> **Versão 1.1 · Fase 1 — MVP** · São Luís, MA, Brasil

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
6. [Integrações com Google Workspace](#6-integrações-com-google-workspace)
7. [Ambiente de Agentes (Claude Code)](#7-ambiente-de-agentes-claude-code)
8. [Variáveis de Ambiente](#8-variáveis-de-ambiente)
9. [Setup e Instalação](#9-setup-e-instalação)
10. [Roadmap](#10-roadmap)

---

## 1. Visão Geral

O FinApp é um aplicativo mobile de controle financeiro pessoal construído em fases incrementais, partindo de controle manual e evoluindo para automações, OCR, inteligência artificial e integrações externas.

### Estado atual da Fase 1

| Módulo | Status |
|---|---|
| Monorepo e estrutura base | ✅ Concluído |
| Schema do banco (5 tabelas) | ✅ Concluído |
| API Express + health endpoint | ✅ Concluído |
| Verificação de conexão ao banco no startup | ✅ Concluído |
| Integração Google Docs/Drive | ✅ Concluído |
| Ambiente de agentes Claude Code | ✅ Concluído |
| Mobile — tela inicial (Hello World) | ✅ Concluído |
| Ambiente de testes da API (Jest + Supertest) | ✅ Concluído |
| Autenticação (rotas e telas) | 🔲 Planejado |
| Módulo de Transações | 🔲 Planejado |
| Módulo de Cartões | 🔲 Planejado |
| Módulo de Metas | 🔲 Planejado |
| Dashboard Home | 🔲 Planejado |

### Escopo do MVP

- Autenticação (Login / Registro / Recuperação de senha)
- Dashboard Home com resumo financeiro e gráficos
- Gerenciamento de Transações (receitas e despesas)
- Gerenciamento de Cartões (crédito e débito)
- Gerenciamento de Metas financeiras
- Perfil do usuário

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

**Por que VPS própria e não serviços como Neon?**
Elimina dependência de free tiers limitados. Banco em `console.neryautoma.site:9567` com acesso total e sem restrições de conexões ou armazenamento.

**Por que monorepo?**
O pacote `packages/db` é importado tanto pela API quanto pelo mobile, garantindo que os tipos das tabelas (`User`, `Transaction`, `Card`, `Goal`) estejam sempre em sincronia sem duplicação.

---

## 3. Estrutura do Monorepo

```
controle-financeiro/
├── apps/
│   ├── mobile/                        # React Native + Expo SDK 54
│   │   ├── app/                       # Rotas via Expo Router (file-based)
│   │   │   ├── (auth)/                # Telas de login e registro (planejado)
│   │   │   └── (tabs)/                # Telas principais com abas (planejado)
│   │   ├── components/                # Componentes reutilizáveis
│   │   ├── hooks/                     # Custom hooks (useTransactions, useGoals...)
│   │   ├── store/                     # Stores Zustand
│   │   └── services/                  # Funções de chamada à API
│   └── api/                           # Node.js + Express + TypeScript
│       └── src/
│           ├── index.ts               # Entry point — Express, CORS, health, DB check
│           ├── routes/                # Rotas da API REST (planejado)
│           ├── controllers/           # Lógica de negócio por módulo (planejado)
│           ├── services/              # Serviços e integrações (Google Auth, Docs)
│           ├── middlewares/           # Auth JWT, validação, erros (planejado)
│           └── scripts/               # Scripts utilitários (export-doc, update-doc)
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

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria novo usuário |
| POST | `/auth/login` | Autentica e retorna JWT |
| POST | `/auth/logout` | Invalida sessão |
| POST | `/auth/forgot-password` | Envia e-mail de recuperação |
| POST | `/auth/reset-password` | Redefine senha com token |

---

### 4.2 Dashboard Home

Tela principal. Exibe resumo financeiro do período atual.

**Dados carregados:**

| Dado | Endpoint | Cache |
|---|---|---|
| Resumo mensal (receitas, despesas, saldo) | `GET /dashboard/summary` | 5 min |
| Últimas transações | `GET /transactions?limit=5` | 2 min |
| Metas ativas com progresso | `GET /goals?active=true` | 5 min |
| Dados do usuário | `GET /users/me` | 30 min |

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

| Campo | Tipo | Observação |
|---|---|---|
| `name` | string | Nome do cartão (ex: Nubank) |
| `type` | enum | `'credit'` ou `'debit'` |
| `last_four` | string(4) | Últimos 4 dígitos |
| `credit_limit` | numeric(12,2) | Limite (só crédito) |
| `closing_day` | int | Dia de fechamento |
| `due_day` | int | Dia de vencimento |
| `color` | string | Cor em hex |

---

### 4.5 Metas

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

## 6. Integrações com Google Workspace

Integração completa com Google Drive e Google Docs via service account para manter a documentação técnica sincronizada com o código.

### Serviços implementados

| Arquivo | Função | Descrição |
|---|---|---|
| `apps/api/src/services/google-auth.service.ts` | `googleAuth` | Singleton de autenticação via service account |
| `apps/api/src/services/docs.service.ts` | `findDocumentId()` | Busca o documento pelo nome no Drive |
| `apps/api/src/services/docs.service.ts` | `exportDocument()` | Exporta o doc como texto plano |
| `apps/api/src/services/docs.service.ts` | `replaceDocumentContent()` | Substitui todo o conteúdo do documento |
| `apps/api/src/services/docs.service.ts` | `appendToDocument()` | Insere texto no final |
| `apps/api/src/services/docs.service.ts` | `replaceSection()` | Substitui trecho por marcador |

### Scripts de sincronização

```bash
# Baixa o Google Doc para base_knowledge/technical/
npx ts-node apps/api/src/scripts/export-doc.ts

# Envia o arquivo local de volta ao Google Doc
npx ts-node apps/api/src/scripts/update-doc.ts
```

### Configuração

A service account `revisador-documentacao-projeto@financeiro-nerydansen.iam.gserviceaccount.com` deve ter permissão de **Editor** no documento `OFFICIAL-FinApp_Documentacao_Tecnica` no Google Drive.

Credencial armazenada como JSON minificado em `GOOGLE_SERVICE_ACCOUNT_KEY` no `.env`.

---

## 7. Ambiente de Agentes (Claude Code)

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

Variáveis necessárias: `TRELLO_API_KEY`, `TRELLO_TOKEN`

### Regras obrigatórias do projeto

- **Nunca** executar `git commit` diretamente — sempre acionar `commit-writer`
- Commits sempre em português brasileiro, `[TYPE]` em inglês
- **Nunca** usar `StyleSheet.create` no mobile — sempre NativeWind
- **Nunca** retornar `passwordHash` em nenhum endpoint
- `userId` sempre vem do JWT, nunca do body ou query string
- **Nunca** duplicar tipos — importar sempre de `@finapp/db`

---

## 8. Variáveis de Ambiente

Crie `.env` na raiz com base no `.env.example`. **Nunca commitar o `.env`.**

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim* | Connection string completa (tem prioridade) |
| `DATABASE_HOST` | Sim* | Host da VPS PostgreSQL |
| `DATABASE_PORT` | Sim* | Porta (padrão: 5432) |
| `DATABASE_USER` | Sim* | Usuário do banco |
| `DATABASE_PASSWORD` | Sim* | Senha do banco |
| `DATABASE_NAME` | Sim* | Nome do banco |
| `JWT_SECRET` | Sim | Chave secreta longa para assinar tokens |
| `PORT` | Não | Porta da API (padrão: 3000) |
| `API_URL` | Não | URL base da API usada pelo mobile |
| `TRELLO_API_KEY` | Não | API key do Trello (MCP) |
| `TRELLO_TOKEN` | Não | Token de acesso do Trello (MCP) |
| `DATABASE_URL_TEST` | Não | Connection string do banco isolado para testes |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Não | JSON da service account (minificado, uma linha) |

> \* `DATABASE_URL` tem prioridade. Se não definida, os parâmetros individuais são usados como fallback.

---

## 9. Setup e Instalação

### Pré-requisitos

- Node.js `24.15.0` (use `nvm use` na raiz — `.nvmrc` já configurado)
- Git
- Expo Go no celular (Play Store / App Store)
- Acesso à VPS com PostgreSQL configurado
- Conta no [Railway](https://railway.app) (deploy da API)
- Conta no [Vercel](https://vercel.com) (deploy do frontend)

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

# Mobile (em outro terminal — escaneie o QR com Expo Go)
npm run mobile
```

### Deploy na Railway

1. Acesse [railway.app](https://railway.app) e crie conta com GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Root directory: `apps/api`
4. Em **Variables**, adicione todas as variáveis do `.env`
5. A Railway detecta Node.js automaticamente e faz o build
6. Anote a URL pública gerada — será usada como `API_URL` no mobile

### Testes da API

O ambiente de testes está configurado em `apps/api`. Utiliza **Jest + ts-jest + Supertest**.

```bash
# Rodar todos os testes (a partir da raiz)
cd apps/api && npm test

# Modo watch
cd apps/api && npm run test:watch
```

**Estrutura de testes:**

```
apps/api/
├── tests/
│   ├── helpers/
│   │   ├── global-setup.ts    # Carrega .env e aponta DATABASE_URL para o banco de teste
│   │   ├── global-teardown.ts # Encerra conexões após todos os testes
│   │   ├── db.ts              # Instância testDb + helper clearTables()
│   │   └── app.ts             # Helper api() com supertest para testes de integração
│   └── <modulo>_<tipo>_test.ts  # Ex: auth_integration_test.ts
└── jest.config.ts
```

**Convenção de nomenclatura dos arquivos de teste:**
`<módulo>_<tipo>_test.ts` — exemplos: `auth_integration_test.ts`, `transactions_unit_test.ts`

**Pré-requisito:** definir `DATABASE_URL_TEST` no `.env` apontando para um banco PostgreSQL separado (`finapp-test`). Se não definida, os testes que acessam o banco falharão com aviso.

---

### Extensões recomendadas (VS Code)

- **ESLint** — lint em tempo real
- **Prettier** — formatação automática
- **Drizzle ORM** — syntax highlight no schema
- **Thunder Client** — cliente HTTP integrado
- **Expo Tools** — suporte ao Expo Router
- **GitLens** — histórico de git inline

---

## 10. Roadmap

| Fase | Nome | Foco | Status |
|---|---|---|---|
| Fase 1 | Controle Financeiro Manual | Receitas, despesas, cartões, metas, gráficos | **MVP** |
| Fase 2 | Automações | Categorização automática, alertas, recorrências | Planejado |
| Fase 3 | OCR + IA | Leitura de extratos e comprovantes | Planejado |
| Fase 4 | Assistente Financeiro IA | Perguntas em linguagem natural | Planejado |
| Fase 5 | Integrações Externas | Uber, iFood, Steam | Futuro |

---

*FinApp · Documentação Técnica v1.1 · Atualizado em 13 mai 2026*
