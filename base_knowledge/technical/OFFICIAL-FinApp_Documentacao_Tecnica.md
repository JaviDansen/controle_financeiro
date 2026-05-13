FinApp
Documentação Técnica do Projeto
Aplicativo Mobile de Controle Financeiro Pessoal
Versão 1.1  ·  Maio 2026
Walber Vidigal  ·  São Luís, MA, Brasil
________________




Sumário


1. Visão Geral do Projeto
2. Stack Tecnológica
3. Estrutura do Monorepo
4. Módulos da Fase 1 — Interfaces Primárias
5. Schema do Banco de Dados — Fase 1
6. Integrações com Google Workspace
7. Ambiente de Agentes (Claude Code)
8. Variáveis de Ambiente
9. Roteiro — Primeira Semana de Tasks
10. Setup Inicial Completo


________________




1. Visão Geral do Projeto
1.1 Objetivo
O FinApp é um aplicativo mobile de controle financeiro pessoal, desenvolvido com foco em micro-empreendedores e usuários individuais que buscam organizar receitas, despesas, metas e cartões em uma única plataforma. O projeto é construído em fases incrementais, partindo de controle manual e evoluindo para automações, OCR, inteligência artificial e integrações externas.




1.2 Roadmap de Fases




Fase        Nome        Foco principal        Status
Fase 1        Controle Financeiro Manual        Receitas, despesas, cartões, metas, gráficos        MVP
Fase 2        Automações        Categorização automática, alertas, previsões, recorrências        Planejado
Fase 3        OCR + IA        Leitura de extratos, comprovantes, importação automática        Planejado
Fase 4        Assistente Financeiro IA        Perguntas em linguagem natural sobre finanças        Planejado
Fase 5        Integrações Externas        Uber, iFood, Steam — após validação do produto        Futuro




1.3 Escopo da Fase 1 — MVP
A Fase 1 entrega o núcleo funcional do produto com os seguintes módulos:




* Autenticação (Login / Registro / Recuperação de senha)
* Dashboard Home com resumo financeiro e gráficos
* Gerenciamento de Transações (receitas e despesas)
* Gerenciamento de Cartões
* Gerenciamento de Metas financeiras
* Perfil do usuário




Estado atual de implementação (Fase 1):


Módulo        Status
Monorepo e estrutura base        Concluído
Schema do banco (5 tabelas)        Concluído
API Express + health endpoint        Concluído
Verificação de conexão ao banco no startup        Concluído
Integração Google Docs/Drive        Concluído
Ambiente de agentes Claude Code        Concluído
Mobile — Hello World (tela inicial)        Concluído
Autenticação (rotas e telas)        Planejado
Módulo de Transações        Planejado
Módulo de Cartões        Planejado
Módulo de Metas        Planejado
Dashboard Home        Planejado




________________




2. Stack Tecnológica
2.1 Visão Geral da Arquitetura
O projeto é organizado como um monorepo com três camadas independentes: mobile, backend e dados. A camada de dados (schema Drizzle) é compartilhada entre o backend e o mobile via pacote interno, eliminando duplicação de tipos TypeScript.




Camada        Tecnologia        Versão        Função
Mobile        React Native + Expo        SDK 54        Interface do usuário. Testado via QR code sem build nativo.
Navegação        Expo Router        ~6.0.0        Roteamento baseado em arquivos (file-based routing).
Estilização        NativeWind        ^4.1.23        Classes Tailwind no React Native.
Estado global        Zustand        ^5.0.0        Gerenciamento de estado leve e tipado.
Cache e fetch        React Query (TanStack)        ^5.40.0        Cache de requests, loading states, refetch automático.
Backend        Node.js + TypeScript + Express        24.15.0 / ^4.19.2        API REST. Deploy na Railway.
Validação        Zod        ^3.23.8        Validação de entrada nas rotas da API.
Autenticação        JWT + bcrypt        jsonwebtoken ^9 / bcryptjs ^2        Tokens de autenticação.
ORM        Drizzle ORM + Drizzle Kit        ^0.31.2        Queries tipadas, migrations e studio local.
Banco de dados        PostgreSQL via VPS própria        —        VPS self-hosted. Sem dependência de serviço externo pago.
Deploy        Vercel (Frontend) + Railway (backend) + VPS (banco)        —        Custo zero até validação do produto.
Integração docs        googleapis        ^171.4.0        Atualização automática da documentação técnica no Google Docs.




2.2 Justificativas Técnicas
Por que Expo Go e não bare React Native?
O Expo Go elimina toda a configuração de ambiente nativo (Android Studio, Xcode). O desenvolvimento e teste são feitos diretamente no celular via QR code. Para um app financeiro na Fase 1, o Expo Go cobre 100% das necessidades. Quando for necessário publicar nas lojas ou usar SDKs nativos avançados (OCR nativo, NFC), a migração para EAS Build é direta.




Por que Drizzle ORM e não TypeORM?
Drizzle oferece type safety superior: o schema é definido em TypeScript puro e os tipos das queries são inferidos automaticamente, sem decorators ou metadata. É mais leve e o Drizzle Studio fornece uma interface gráfica local para inspecionar o banco sem ferramentas externas.




Por que VPS própria e não Neon?
A VPS PostgreSQL self-hosted elimina dependência de serviços de terceiros com free tiers limitados. O banco roda em console.neryautoma.site:9567 com acesso total e sem restrições de conexões simultâneas ou armazenamento.




Por que monorepo?
O pacote packages/db contém o schema Drizzle e é importado tanto pela API quanto pelo mobile. Isso garante que os tipos das tabelas (User, Transaction, Card, Goal) estejam sempre em sincronia nos dois lados sem necessidade de duplicação ou geração de código.


2.3 GitHub
https://github.com/JaviDansen/controle_financeiro


2.4 Frontend (Vercel)
https://financeiro.neryautoma.site


2.5 Kanban (Trello)
https://trello.com/invite/b/6a04828869137d9804bc5c37/ATTI141ef6b1134beaa4d6617762ff2f23e7ED535267/meu-quadro-do-trello




________________




3. Estrutura do Monorepo
3.1 Organização
O projeto utiliza npm workspaces para gerenciar três pacotes: o app mobile, a API backend e o pacote compartilhado de banco de dados.




Caminho        Descrição
controle-financeiro/        Raiz do monorepo
apps/mobile/        Aplicativo React Native + Expo
apps/mobile/app/        Rotas via Expo Router (file-based)
apps/mobile/app/(auth)/        Telas de login e registro (planejado)
apps/mobile/app/(tabs)/        Telas principais com navegação por abas (planejado)
apps/mobile/components/        Componentes reutilizáveis
apps/mobile/hooks/        Custom hooks (useTransactions, useGoals...)
apps/mobile/store/        Stores Zustand
apps/mobile/services/        Funções de chamada à API
apps/api/        Backend Node.js + Express
apps/api/src/index.ts        Entry point — Express, CORS, health, DB check
apps/api/src/routes/        Rotas da API REST (planejado)
apps/api/src/controllers/        Lógica de negócio por módulo (planejado)
apps/api/src/services/        Serviços e integrações (Google Auth, Docs)
apps/api/src/middlewares/        Auth JWT, validação, erros (planejado)
apps/api/src/scripts/        Scripts utilitários (export-doc.ts, update-doc.ts)
packages/db/        Schema Drizzle + migrations (compartilhado)
packages/db/schema/        Definição das tabelas TypeScript
packages/db/migrations/        Arquivos de migration gerados pelo Drizzle Kit
.env        Variáveis de ambiente (nunca commitar)
.env.example        Template de variáveis de ambiente
.claude/        Configurações do agente Claude Code
.claude/skills/        Skills do projeto (nova-rota, nova-tela, etc.)
.mcp.json        Configuração dos servidores MCP (Trello)
.nvmrc        Versão do Node.js para nvm (24.15.0)
base_knowledge/tasks/        Histórico visual de implementações concluídas
base_knowledge/technical/        Documentação técnica local (sincronizada com Google Docs)




________________




4. Módulos da Fase 1 — Interfaces Primárias
4.1 Módulo de Autenticação
Ponto de entrada do aplicativo. Gerencia o ciclo completo de autenticação do usuário.




Telas
* Login — e-mail + senha, link para registro e recuperação
* Registro — nome, e-mail, senha, confirmação
* Recuperação de senha — envio de link por e-mail




Fluxo técnico
1. Usuário preenche formulário validado por Zod no mobile
2. Mobile envia POST /auth/login para a API
3. API valida credenciais com bcrypt, gera JWT
4. Token armazenado em SecureStore do Expo + Zustand
5. React Query invalida cache e redireciona para a Home




Endpoints da API
Método        Rota        Descrição
POST        /auth/register        Cria novo usuário
POST        /auth/login        Autentica e retorna JWT
POST        /auth/logout        Invalida sessão
POST        /auth/forgot-password        Envia e-mail de recuperação
POST        /auth/reset-password        Redefine senha com token




4.2 Módulo Home — Dashboard
Tela principal do aplicativo. Exibe um resumo financeiro do período atual com acesso rápido às funcionalidades.




Componentes da interface
* Header com saudação, nome do usuário e mês atual
* Card de saldo — receitas, despesas e saldo líquido do mês
* Gráfico de pizza — distribuição por categoria de despesas
* Lista das últimas 5 transações com ícone de categoria
* Barra de progresso das metas ativas
* Acesso rápido: botão flutuante para nova transação




Dados carregados na Home
Dado        Endpoint        Cache (React Query)
Resumo mensal (receitas, despesas, saldo)        GET /dashboard/summary        5 minutos
Últimas transações        GET /transactions?limit=5        2 minutos
Metas ativas com progresso        GET /goals?active=true        5 minutos
Dados do usuário        GET /users/me        30 minutos




4.3 Módulo de Transações
Gerenciamento completo de receitas e despesas. É o módulo central do MVP.




Telas
* Lista de transações — filtros por tipo, categoria, data e cartão
* Detalhe da transação
* Formulário de criação / edição




Campos de uma transação
Campo        Tipo        Obrigatório        Observação
title        string        Sim        Descrição da transação
amount        decimal        Sim        Valor sempre positivo
type        enum        Sim        'income' ou 'expense'
category_id        uuid FK        Sim        Categoria da transação
card_id        uuid FK        Não        Cartão utilizado (opcional)
date        date        Sim        Data da transação
notes        text        Não        Observações livres
is_recurring        boolean        Sim        Flag de recorrência (Fase 2)




Endpoints da API
Método        Rota        Descrição
GET        /transactions        Lista com filtros e paginação
POST        /transactions        Cria nova transação
GET        /transactions/:id        Retorna transação por ID
PATCH        /transactions/:id        Atualiza transação
DELETE        /transactions/:id        Remove transação
GET        /transactions/summary        Totais por tipo e categoria




4.4 Módulo de Cartões
Cadastro e acompanhamento de cartões de crédito e débito para categorização de transações.




Campos de um cartão
Campo        Tipo        Observação
name        string        Nome do cartão (ex: Nubank)
type        enum        'credit' ou 'debit'
last_four        string(4)        Últimos 4 dígitos
credit_limit        decimal        Limite (apenas cartões de crédito)
closing_day        int        Dia de fechamento da fatura
due_day        int        Dia de vencimento da fatura
color        string        Cor de identificação visual (hex)




4.5 Módulo de Metas
Permite criar objetivos financeiros com valor alvo, prazo e acompanhamento de progresso.




Campos de uma meta
Campo        Tipo        Observação
title        string        Nome da meta (ex: Viagem, Reserva)
target_amount        decimal        Valor a ser atingido
current_amount        decimal        Valor já acumulado
deadline        date        Data limite (opcional)
category        string        Categoria visual da meta
is_active        boolean        Meta em andamento ou concluída




________________




5. Schema do Banco de Dados — Fase 1
5.1 Tabelas e Relacionamentos
Todas as tabelas utilizam UUID como chave primária e registram created_at e updated_at automaticamente. O banco roda em PostgreSQL self-hosted na VPS em console.neryautoma.site:9567.




Tabela        Relações        Observação
users        —        Usuário autenticado
categories        belongs to users        Categorias de transações por usuário
cards        belongs to users        Cartões de crédito e débito
transactions        belongs to users, categories, cards        Receitas e despesas
goals        belongs to users        Metas financeiras




5.2 Campos Principais por Tabela




users
Coluna        Tipo        Restrição
id        uuid        PK, default gen_random_uuid()
name        varchar(100)        NOT NULL
email        varchar(255)        NOT NULL, UNIQUE
password_hash        text        NOT NULL
created_at        timestamp        NOT NULL, default now()
updated_at        timestamp        NOT NULL, default now()




transactions
Coluna        Tipo        Restrição
id        uuid        PK
user_id        uuid        FK → users.id, NOT NULL, cascade delete
category_id        uuid        FK → categories.id, NOT NULL
card_id        uuid        FK → cards.id, NULLABLE
title        varchar(200)        NOT NULL
amount        numeric(12,2)        NOT NULL
type        varchar(10)        'income' | 'expense'
date        date        NOT NULL
notes        text        NULLABLE
is_recurring        boolean        default false
created_at        timestamp        NOT NULL




5.3 Comandos do Banco




# Gerar migrations após alterar schema
npm run db:generate


# Aplicar migrations na VPS
npm run migrations


# Abrir Drizzle Studio local
npm run db:studio




________________




6. Integrações com Google Workspace
6.1 Visão Geral
A API possui integração completa com Google Drive e Google Docs via service account. O objetivo principal é manter a documentação técnica do projeto (este documento) sempre sincronizada com o estado real do código.




Credencial utilizada: Service Account do Google Cloud
Escopos habilitados: drive (leitura/escrita) + documents (leitura/escrita)




6.2 Serviços Implementados




Arquivo        Função        Descrição
apps/api/src/services/google-auth.service.ts        googleAuth        Singleton de autenticação via service account. Lê GOOGLE_SERVICE_ACCOUNT_KEY do .env.
apps/api/src/services/docs.service.ts        findDocumentId()        Busca o documento "OFFICIAL-FinApp_Documentacao_Tecnica" no Drive pelo nome.
apps/api/src/services/docs.service.ts        exportDocument()        Exporta o conteúdo do documento como texto plano via Drive API.
apps/api/src/services/docs.service.ts        replaceDocumentContent()        Substitui todo o conteúdo do documento (deleteContentRange + insertText).
apps/api/src/services/docs.service.ts        appendToDocument()        Insere texto no final do documento.
apps/api/src/services/docs.service.ts        replaceSection()        Substitui um trecho específico por marcador de texto.




6.3 Scripts de Sincronização




Script        Comando        O que faz
apps/api/src/scripts/export-doc.ts        npx ts-node apps/api/src/scripts/export-doc.ts        Baixa o Google Doc e salva em base_knowledge/technical/ como .md
apps/api/src/scripts/update-doc.ts        npx ts-node apps/api/src/scripts/update-doc.ts        Lê o arquivo local e envia de volta ao Google Doc (full replace)




6.4 Skill /doc-technical-reviewer
Skill em .claude/skills/doc-technical-reviewer/SKILL.md que orquestra o fluxo completo:


1. Baixar o documento (export-doc.ts)
2. Ler e comparar com git diffs
3. Atualizar o arquivo local
4. Enviar de volta ao Google Docs (update-doc.ts)
5. Re-baixar para confirmar sincronização
6. Commitar e fazer push de base_knowledge/technical/




6.5 Configuração da Service Account
A service account revisador-documentacao-projeto@financeiro-nerydansen.iam.gserviceaccount.com deve ter permissão de Editor no documento OFFICIAL-FinApp_Documentacao_Tecnica no Google Drive.


A credencial é armazenada como JSON minificado em GOOGLE_SERVICE_ACCOUNT_KEY no .env.




________________




7. Ambiente de Agentes (Claude Code)
7.1 Visão Geral
O projeto utiliza Claude Code (CLI da Anthropic) como agente de desenvolvimento. O arquivo .claude/settings.json define permissões, MCPs habilitados e comportamentos automáticos.




7.2 Skills Disponíveis




Comando        Arquivo        O que faz
/nova-rota <módulo>        .claude/skills/nova-rota/SKILL.md        Cria route + controller com JWT, Zod e Drizzle
/nova-tela <nome> <grupo>        .claude/skills/nova-tela/SKILL.md        Cria tela Expo + hook React Query + service
/novo-schema <tabela>        .claude/skills/novo-schema/SKILL.md        Adiciona tabela ao Drizzle com tipos inferidos
/migrar-db        .claude/skills/migrar-db/SKILL.md        Gera migration, revisa e aplica na VPS
/atualizar-tasks        .claude/skills/atualizar-tasks/SKILL.md        Atualiza base_knowledge/tasks.html
/fazer-commit        .claude/skills/fazer-commit/SKILL.md        Delega commit ao agente commit-writer
/doc-technical-reviewer        .claude/skills/doc-technical-reviewer/SKILL.md        Sincroniza documentação técnica com Google Docs




7.3 MCP do Trello
Servidor MCP do Trello configurado em .mcp.json. Permite ao agente interagir com o Kanban do projeto diretamente durante o desenvolvimento.


Variáveis necessárias: TRELLO_API_KEY, TRELLO_TOKEN (ver .env.example)




7.4 Regras do Projeto
* Nunca executar git commit diretamente — sempre acionar commit-writer
* Commits sempre em português brasileiro, [TYPE] em inglês
* Nunca usar StyleSheet.create no mobile — sempre NativeWind
* Nunca retornar passwordHash em nenhum endpoint
* userId sempre vem do JWT, nunca do body
* Nunca duplicar tipos — importar sempre de @finapp/db




________________




8. Variáveis de Ambiente
8.1 Arquivo .env (raiz do monorepo)
Nunca commitar o arquivo .env. Use o .env.example como referência.




Variável        Obrigatória        Descrição
DATABASE_URL        Sim*        Connection string completa do PostgreSQL (tem prioridade sobre parâmetros individuais)
DATABASE_HOST        Sim*        Host da VPS PostgreSQL
DATABASE_PORT        Sim*        Porta do PostgreSQL (padrão: 5432)
DATABASE_USER        Sim*        Usuário do banco
DATABASE_PASSWORD        Sim*        Senha do banco
DATABASE_NAME        Sim*        Nome do banco
JWT_SECRET        Sim        Chave secreta longa para assinar tokens JWT
PORT        Não        Porta da API (padrão: 3000)
API_URL        Não        URL base da API usada pelo mobile
TRELLO_API_KEY        Não        API key do Trello (MCP)
TRELLO_TOKEN        Não        Token de acesso do Trello (MCP)
GOOGLE_SERVICE_ACCOUNT_KEY        Não        JSON da service account do Google Cloud (minificado, uma linha)




* DATABASE_URL tem prioridade. Se não definida, os parâmetros individuais são usados como fallback.




________________




9. Roteiro — Primeira Semana de Tasks
9.1 Visão Geral da Semana
A primeira semana tem como objetivo ter o ambiente completamente configurado, o banco de dados criado com schema real, a autenticação funcionando de ponta a ponta (mobile ↔ API ↔ banco) e a tela de Home com dados reais.




Dia        Foco        Entrega esperada        Status
Dia 1        Setup de ambiente e monorepo        Projeto criado, Expo rodando, API com health endpoint        Concluído
Dia 2        Schema do banco e conexão VPS        Tabelas criadas na VPS, Drizzle Studio funcionando        Concluído
Dia 3        Backend — módulo de autenticação        Rotas /auth/* funcionando com JWT        Pendente
Dia 4        Mobile — telas de autenticação        Login e Registro conectados à API real        Pendente
Dia 5        Backend — módulo de transações e categorias        CRUD completo de transações        Pendente
Dia 6        Mobile — Home e listagem de transações        Dashboard com dados reais do banco        Pendente
Dia 7        Revisão, ajustes e testes manuais        Fluxo completo testado no celular via Expo Go        Pendente




9.2 Tasks Detalhadas por Dia




Dia 1 — Setup de Ambiente e Monorepo (Concluído)
1. Instalar Node.js 24.15.0, Git, VS Code
2. Criar estrutura do monorepo com npm workspaces
3. Configurar package.json raiz com scripts globais
4. Inicializar apps/api com Express + TypeScript + ts-node-dev
5. Criar rota GET /health que retorna { status: 'ok' }
6. Inicializar apps/mobile com npx create-expo-app
7. Testar Expo Go no celular via QR code
8. Criar repositório no GitHub e primeiro commit




Dia 2 — Schema do Banco e VPS PostgreSQL (Concluído)
9. Configurar acesso ao PostgreSQL da VPS (console.neryautoma.site:9567)
10. Copiar as variáveis de conexão para o arquivo .env
11. Inicializar packages/db com Drizzle e drizzle-kit
12. Criar schema: users, categories, cards, transactions, goals
13. Rodar npm run db:generate para gerar migrations
14. Rodar npm run migrations para aplicar na VPS
15. Abrir Drizzle Studio (npm run db:studio) e verificar tabelas
16. Configurar buildConnectionString() com suporte a parâmetros individuais e DATABASE_URL




Dia 3 — Backend: Autenticação
17. Criar middleware de autenticação JWT
18. Implementar POST /auth/register com validação Zod
19. Implementar POST /auth/login com retorno de token
20. Implementar POST /auth/logout
21. Implementar GET /users/me (rota protegida de teste)
22. Testar todas as rotas com Insomnia ou Thunder Client




Dia 4 — Mobile: Telas de Autenticação
23. Configurar Expo Router com grupos (auth) e (tabs)
24. Instalar NativeWind e configurar Tailwind no projeto
25. Criar tela de Login com formulário validado por Zod
26. Criar tela de Registro
27. Criar service de auth em services/auth.ts
28. Criar store Zustand para armazenar dados do usuário
29. Conectar login à API real e redirecionar para Home
30. Persistir token com Expo SecureStore




Dia 5 — Backend: Transações e Categorias
31. Implementar CRUD completo de categories
32. Implementar CRUD completo de transactions
33. Adicionar filtros por tipo, data e categoria nas listagens
34. Implementar GET /dashboard/summary (totais do mês)
35. Garantir que todas as rotas verificam o user_id do JWT




Dia 6 — Mobile: Home e Transações
36. Configurar React Query no mobile
37. Criar tela Home com card de saldo e últimas transações
38. Criar tela de listagem de transações com filtros básicos
39. Criar formulário de nova transação (tipo, valor, categoria, data)
40. Criar hook useTransactions com React Query
41. Testar fluxo completo: criar transação → ver na Home




Dia 7 — Revisão e Ajustes
42. Testar fluxo completo no celular real via Expo Go
43. Corrigir bugs de layout em diferentes tamanhos de tela
44. Validar tratamento de erros na API (401, 404, 422)
45. Verificar que o token expira corretamente e faz logout
46. Revisar variáveis de ambiente e .env.example
47. Fazer deploy do backend na Railway
48. Documentar no README os passos de setup




________________




10. Setup Inicial Completo
10.1 Ferramentas para Instalar na Máquina




Ferramenta        Versão        Como instalar        Finalidade
Node.js        24.15.0        nodejs.org/en/download        Runtime do backend e scripts
nvm        —        github.com/nvm-sh/nvm        Gerenciador de versão do Node (.nvmrc na raiz)
Git        Mais recente        git-scm.com/download/win        Controle de versão
VS Code        Mais recente        code.visualstudio.com        Editor principal
Expo Go (app)        Mais recente        Play Store / App Store no celular        Testar o app mobile
Thunder Client        —        Extensão VS Code        Testar rotas da API




10.2 Extensões Recomendadas no VS Code




* ESLint — lint em tempo real
* Prettier — formatação automática
* Drizzle ORM — syntax highlight no schema
* Thunder Client — cliente HTTP integrado ao VS Code
* Expo Tools — suporte ao Expo Router
* GitLens — histórico de git inline




10.3 Painéis Externos (Cloud e Serviços)




Serviço        URL        Para que serve
Railway        railway.app        Deploy e hosting do backend Node.js
GitHub        github.com        Repositório e CI/CD futuro
Vercel        vercel.com        Deploy do frontend (financeiro.neryautoma.site)
Google Cloud Console        console.cloud.google.com        Gerenciar service accounts e APIs
Trello        trello.com        Kanban do projeto
Expo EAS        expo.dev        Build para lojas (Fase futura)




10.4 Comandos do Projeto (Monorepo)




# Instalar todas as dependências
npm install


# Rodar a API (porta 3000)
npm run api


# Rodar o mobile (Expo)
npm run mobile


# Gerar migrations após alterar schema
npm run db:generate


# Aplicar migrations na VPS
npm run migrations


# Abrir Drizzle Studio
npm run db:studio




10.5 Configuração da Railway (Passo a Passo)


1. Acesse railway.app e crie uma conta com GitHub
2. Clique em 'New Project' → 'Deploy from GitHub repo'
3. Autorize o Railway a acessar o repositório
4. Selecione o repositório e aponte o root directory para apps/api
5. Em 'Variables', adicione as mesmas variáveis do .env
6. A Railway detecta automaticamente Node.js e faz o build
7. Anote a URL pública gerada — será usada no mobile como API_URL




________________




FinApp — Documentação Técnica v1.1  ·  Atualizado em 13 mai 2026