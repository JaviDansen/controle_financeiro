# FinApp — Controle Financeiro Pessoal

Aplicativo mobile de controle financeiro pessoal para micro-empreendedores e usuários individuais. Desenvolvido como monorepo com React Native (Expo), Node.js e PostgreSQL.

> **Versão 1.0 · Fase 1 — MVP** · São Luís, MA, Brasil

---

## Funcionalidades (Fase 1 — MVP)

- Autenticação completa (Login, Registro, Recuperação de senha)
- Dashboard com resumo financeiro e gráficos
- Gerenciamento de Transações (receitas e despesas)
- Gerenciamento de Cartões (crédito e débito)
- Gerenciamento de Metas financeiras
- Perfil do usuário

---

## Stack

| Camada | Tecnologia |
|---|---|
| Mobile | React Native + Expo Go |
| Navegação | Expo Router (file-based) |
| Estilização | NativeWind (Tailwind) |
| Estado global | Zustand |
| Cache / Fetch | React Query (TanStack) |
| Backend | Node.js + TypeScript + Express |
| Validação | Zod |
| Autenticação | JWT + bcrypt |
| ORM | Drizzle ORM + Drizzle Kit |
| Banco de dados | PostgreSQL (VPS própria) |
| Deploy | Vercel (frontend) + Railway (backend) + VPS (banco) |

---

## Estrutura do Monorepo

```
finapp/
├── apps/
│   ├── mobile/          # React Native + Expo
│   │   ├── app/         # Rotas (Expo Router)
│   │   │   ├── (auth)/  # Login e Registro
│   │   │   └── (tabs)/  # Telas principais
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/       # Zustand
│   │   └── services/    # Chamadas à API
│   └── api/             # Node.js + Express
│       └── src/
│           ├── routes/
│           ├── controllers/
│           ├── services/
│           └── middlewares/
└── packages/
    └── db/              # Schema Drizzle compartilhado
        ├── schema/
        └── migrations/
```

---

## Setup

### Pré-requisitos

- Node.js 24.15.0
- Git
- Expo Go (celular — Play Store / App Store)
- Acesso à VPS com PostgreSQL configurado
- Conta no [Railway](https://railway.app) (deploy da API)
- Conta no [Vercel](https://vercel.com) (deploy do frontend)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/JaviDansen/controle_financeiro
cd finapp

# Instalar dependências de todos os workspaces
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL=postgresql://...   # Connection string da VPS
JWT_SECRET=sua_chave_secreta
PORT=3000
```

> Nunca commite o `.env`. Adicione-o ao `.gitignore`.

### Banco de dados

```bash
cd packages/db

npx drizzle-kit generate   # Gera migrations
npx drizzle-kit migrate    # Aplica no PostgreSQL da VPS
npx drizzle-kit studio     # Abre GUI local
```

### Rodar localmente

```bash
# Backend
cd apps/api
npm run dev

# Mobile (em outro terminal)
cd apps/mobile
npx expo start
# Escaneie o QR code com o Expo Go no celular
```

---

## Principais Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria novo usuário |
| POST | `/auth/login` | Autentica e retorna JWT |
| POST | `/auth/logout` | Invalida sessão |
| GET | `/users/me` | Dados do usuário autenticado |
| GET | `/transactions` | Lista com filtros e paginação |
| POST | `/transactions` | Cria nova transação |
| PATCH | `/transactions/:id` | Atualiza transação |
| DELETE | `/transactions/:id` | Remove transação |
| GET | `/dashboard/summary` | Totais de receitas, despesas e saldo |
| GET | `/goals` | Lista metas financeiras |

---

## Roadmap

| Fase | Nome | Status |
|---|---|---|
| Fase 1 | Controle Financeiro Manual | **MVP** |
| Fase 2 | Automações (categorização, alertas, recorrências) | Planejado |
| Fase 3 | OCR + IA (leitura de extratos e comprovantes) | Planejado |
| Fase 4 | Assistente Financeiro IA (linguagem natural) | Planejado |
| Fase 5 | Integrações externas (Uber, iFood, Steam) | Futuro |

---

## Autor

**Walber Vidigal** · São Luís, MA, Brasil
