# FinApp — Instruções do Projeto

## Visão Geral

Aplicativo mobile de controle financeiro pessoal. Monorepo com três camadas:

- `apps/mobile` — React Native + Expo SDK 53 (interface do usuário)
- `apps/api` — Node.js + Express + TypeScript (API REST)
- `packages/db` — Schema Drizzle compartilhado entre api e mobile

**Fase atual: Fase 1 — MVP**. Foco exclusivo em autenticação, transações, cartões, metas e dashboard.

## Stack e Versões Fixas

| Camada | Tecnologia | Versão |
|---|---|---|
| Mobile | Expo SDK | ~54.0.0 |
| Mobile | React Native | 0.81.5 |
| Mobile | Expo Router | ~6.0.0 |
| Mobile | NativeWind | ^4.1.23 |
| Mobile | Zustand | ^5.0.0 |
| Mobile | React Query | ^5.40.0 |
| Backend | Node.js | 24.15.0 |
| Backend | Express | ^4.19.2 |
| Banco | Drizzle ORM | ^0.31.2 |
| Banco | PostgreSQL | VPS própria |
| Validação | Zod | ^3.23.8 |
| Auth | JWT + bcrypt | jsonwebtoken ^9 + bcryptjs ^2 |

**Nunca altere versões do Expo/React Native sem checar compatibilidade** — use `npx expo install <pacote>` para o mobile.

## Estrutura de Diretórios

```
controle-financeiro/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── index.ts          # Entry point Express
│   │       ├── routes/           # Registra rotas por módulo
│   │       ├── controllers/      # Lógica de negócio
│   │       ├── middlewares/      # Auth JWT, validação, erros
│   │       └── services/         # Integrações e lógica auxiliar
│   └── mobile/
│       └── app/
│           ├── _layout.tsx       # Root layout
│           ├── (auth)/           # Login, Registro, Recuperação
│           └── (tabs)/           # Home, Transações, Cartões, Metas, Perfil
│       ├── components/           # Componentes reutilizáveis
│       ├── hooks/                # Custom hooks (useTransactions, useGoals...)
│       ├── store/                # Stores Zustand
│       └── services/             # Funções de chamada à API
└── packages/
    └── db/
        ├── schema/               # Definição das tabelas (ÚNICA fonte de verdade)
        │   ├── users.ts
        │   ├── categories.ts
        │   ├── cards.ts
        │   ├── transactions.ts
        │   ├── goals.ts
        │   └── index.ts
        ├── migrations/           # Gerado pelo Drizzle Kit — nunca editar manualmente
        └── src/
            └── index.ts          # Exporta `db` e todos os schemas

```

## Comandos

```bash
# Instalar tudo
npm install

# Rodar backend (porta 3000)
npm run api

# Rodar mobile (Expo)
npm run mobile

# Banco de dados
npm run db:generate   # Gera migration após alterar schema
npm run db:migrations # Aplica migrations na VPS
npm run db:studio     # Abre Drizzle Studio local
```

## Variáveis de Ambiente

Arquivo `.env` na raiz do projeto (nunca commitar):

```
DATABASE_URL=postgresql://usuario:senha@ip-da-vps:5432/finapp
JWT_SECRET=chave_longa_e_aleatoria
PORT=3000
API_URL=http://localhost:3000
```

## Convenções de Código

### API (apps/api)

- **Toda rota protegida** deve usar o middleware `authMiddleware` que extrai `userId` do JWT
- **Toda entrada** de dado deve ser validada com Zod antes de chegar no controller
- **Nunca** expor `passwordHash` em respostas
- Erros HTTP: `400` validação, `401` não autenticado, `403` sem permissão, `404` não encontrado, `422` entidade inválida
- Estrutura de uma rota: `routes/` registra → `controllers/` executa → `services/` lógica auxiliar
- Sempre filtrar por `userId` do token, nunca confiar em `userId` do body

### Mobile (apps/mobile)

- **Estilos sempre com NativeWind** (classes Tailwind) — nunca usar `StyleSheet.create`
- **Chamadas à API sempre via React Query** — nunca fetch direto em componente
- **Estado global via Zustand** — apenas para dados persistidos (usuário autenticado, preferências)
- **Formulários validados com Zod** antes de enviar à API
- Nomenclatura de arquivos: `kebab-case` para rotas, `PascalCase` para componentes

### Banco de Dados (packages/db)

- **Nunca duplicar tipos** — importar sempre de `@finapp/db`
- **Nunca escrever SQL raw** — usar Drizzle ORM
- Após alterar qualquer arquivo em `schema/`, rodar `npm run db:generate` e depois `npm run db:migrate`
- Migrations em `packages/db/migrations/` são **geradas automaticamente** — nunca editar

## Regras de Arquitetura

1. O pacote `@finapp/db` é a única fonte de verdade dos tipos das tabelas
2. O `userId` sempre vem do JWT, nunca do body ou query string
3. Respostas da API sempre em JSON com estrutura `{ data }` ou `{ error, message }`
4. O mobile nunca acessa o banco diretamente — sempre via API REST
5. Categorias padrão são inseridas via seed no banco — não hardcoded no mobile

## Deploy

| Serviço | O que hospeda | Como fazer deploy |
|---|---|---|
| Railway | `apps/api` | Push no GitHub → deploy automático |
| Vercel | `apps/mobile` (web, se houver) | Push no GitHub → deploy automático |
| VPS | PostgreSQL | Manual via SSH |

## Skills Disponíveis

| Comando | O que faz |
|---|---|
| `/nova-rota <módulo>` | Cria route + controller com JWT, Zod e Drizzle |
| `/nova-tela <nome> <grupo>` | Cria tela Expo + hook React Query + service |
| `/novo-schema <tabela>` | Adiciona tabela ao Drizzle com tipos inferidos |
| `/migrar-db` | Gera migration, revisa e aplica na VPS |
| `/atualizar-tasks` | Atualiza `base_knowledge/tasks.html` com novas implementações |
| `/fazer-commit` | Delega o commit ao agente commit-writer (ver regra abaixo) |

## Regra de Commits — OBRIGATÓRIO

**Nunca execute `git commit` diretamente.** Sempre acione o agente `commit-writer` para gerar e executar o commit. Ele analisa o diff real, classifica o tipo correto (`[FEAT]`, `[FIX]`, `[CHORE]`, etc.) e verifica coesão das mudanças.

Fluxo correto ao final de qualquer implementação:
1. Implementação concluída
2. `/atualizar-tasks` (se for implementação relevante)
3. Acionar `commit-writer` via Agent tool para commitar

## Skills Globais — Quando Usar no FinApp

Quatro skills globais disponíveis que se aplicam ao desenvolvimento das telas mobile.

---

### `/impeccable` — Auditoria e melhoria de interfaces

**O que faz:** Skill completa de design de UI/UX. Cobre hierarquia visual, acessibilidade, tipografia, espaçamento, cores, micro-interações, estados de erro, empty states e responsividade.

**Quando usar no FinApp:**
- Antes de finalizar qualquer tela mobile — rodar `/impeccable critique <tela>` para auditoria de UX
- Quando uma tela parecer "genérica" ou sem personalidade — `/impeccable bolder`
- Para revisar copy (labels, mensagens de erro, placeholders) — `/impeccable clarify`
- Para adicionar animações com propósito — `/impeccable animate`

**Pré-requisito:** A skill precisa de um `PRODUCT.md` para contextualizar o produto. Antes do primeiro uso, rodar `/impeccable teach` para criar esse arquivo com as informações do FinApp (público-alvo: micro-empreendedores, tom: direto e confiável, anti-referências: apps bancários formais).

**Subcomandos mais úteis para o projeto:**

| Subcomando | Quando usar |
|---|---|
| `/impeccable critique <tela>` | Auditoria de UX antes de finalizar |
| `/impeccable polish <tela>` | Último ajuste de qualidade antes de entregar |
| `/impeccable animate <tela>` | Adicionar animações com propósito |
| `/impeccable harden <tela>` | Garantir estados de erro, loading e edge cases |
| `/impeccable clarify <tela>` | Revisar labels, copy e mensagens |

---

### `/emil-design-eng` — Decisões de animação e polish

**O que faz:** Encoda a filosofia de design de Emil Kowalski. Define quando animar (e quando não animar), quais easing curves usar, durações corretas, spring physics, e os detalhes invisíveis que fazem uma interface parecer premium.

**Quando usar no FinApp:**
- Ao implementar transições entre telas (login → home, telas dos tabs)
- Em qualquer elemento interativo: botões de submit, swipe em transações, pull-to-refresh
- Quando uma animação parecer estranha ou lenta — a skill tem framework de diagnóstico
- Para decidir se um elemento DEVE animar (a resposta frequentemente é: não)

**Regras críticas desta skill que se aplicam ao React Native:**
- Botões precisam de `scale(0.97)` no `:active` — feedback tátil imediato
- Nunca animar a partir de `scale(0)` — sempre de `scale(0.95)` com opacidade
- Animações de UI devem ficar abaixo de 300ms
- Ações frequentes (ex: abrir teclado, navegar entre tabs) — **sem animação**
- `ease-out` para elementos entrando, `ease-in-out` para movimento na tela

---

### `/taste-skill` — Arquitetura de componentes e padrões visuais

**O que faz:** Senior UI/UX Engineer com regras métricas estritas. Combate padrões genéricos de AI (Inter font, gradients em texto, glows roxos, grids de 3 cards iguais). Configura baselines de design: `DESIGN_VARIANCE: 8`, `MOTION_INTENSITY: 6`, `VISUAL_DENSITY: 4`.

**Quando usar no FinApp:**
- Ao criar componentes reutilizáveis (`components/`) — para não cair em padrões genéricos
- No Dashboard/Home — que tende a virar "hero-metric template" (número grande + label)
- Para componentes de lista de transações — evitar o grid de 3 cards idênticos
- Em qualquer tela que pareça "feita por IA" — a skill tem checklist específico

**Regras desta skill que substituem defaults:**
- Nunca usar `h-screen` — sempre `min-h-[100dvh]` para evitar bug no iOS Safari
- Nunca usar `Inter` — preferir `Geist`, `Satoshi` ou `Cabinet Grotesk`
- Cards só quando elevação comunica hierarquia — agrupar com `border-t` ou espaçamento
- Empty states são obrigatórios — toda lista precisa de um estado vazio bem composto
- Loading: skeleton loaders no layout real, nunca spinner genérico circular

---

### `/graphify` — Knowledge graph da arquitetura

**O que faz:** Transforma qualquer conjunto de arquivos em um knowledge graph navegável com detecção de comunidades, conexões surpresa e relatório de auditoria. Gera HTML interativo.

**Quando usar no FinApp:**
- Quando o projeto crescer e for difícil rastrear dependências entre módulos
- Para mapear visualmente como `packages/db`, `apps/api` e `apps/mobile` se conectam
- Antes de grandes refatorações — para entender o impacto de mudanças
- Para onboarding de novos colaboradores — gera mapa visual da arquitetura

**Como usar:**
```bash
/graphify apps/        # mapa de toda a camada de aplicação
/graphify packages/db/ # dependências do schema compartilhado
/graphify .            # projeto completo
```

---

## base_knowledge

Pasta local (ignorada pelo Git) com artefatos auxiliares do projeto:

- `base_knowledge/tasks.html` — histórico visual de todas as implementações concluídas

Após qualquer implementação relevante, rodar `/atualizar-tasks` para manter o histórico atualizado.

## O Que NÃO Fazer

- Não usar Neon — banco é PostgreSQL na VPS própria
- Não commitar `.env`
- Não instalar pacotes no mobile sem verificar compatibilidade com Expo SDK 53
- Não usar `StyleSheet.create` no mobile
- Não fazer queries SQL diretamente — sempre Drizzle ORM
- Não retornar `passwordHash` em nenhum endpoint
- Não criar arquivos de documentação `.md` sem pedido explícito
