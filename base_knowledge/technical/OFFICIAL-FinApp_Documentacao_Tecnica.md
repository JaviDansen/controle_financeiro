FinApp
Documentação Técnica do Projeto
Aplicativo Mobile de Controle Financeiro Pessoal
Versão 1.0  ·  Maio 2026
Walber Vidigal  ·  São Luís, MA, Brasil
________________


Sumário




________________


1. Visão Geral do Projeto
1.1 Objetivo
O FinApp é um aplicativo mobile de controle financeiro pessoal, desenvolvido com foco em micro-empreendedores e usuários individuais que buscam organizar receitas, despesas, metas e cartões em uma única plataforma. O projeto é construído em fases incrementais, partindo de controle manual e evoluindo para automações, OCR, inteligência artificial e integrações externas.


1.2 Roadmap de Fases


Fase
	Nome
	Foco principal
	Status
	Fase 1
	Controle Financeiro Manual
	Receitas, despesas, cartões, metas, gráficos
	MVP
	Fase 2
	Automações
	Categorização automática, alertas, previsões, recorrências
	Planejado
	Fase 3
	OCR + IA
	Leitura de extratos, comprovantes, importação automática
	Planejado
	Fase 4
	Assistente Financeiro IA
	Perguntas em linguagem natural sobre finanças
	Planejado
	Fase 5
	Integrações Externas
	Uber, iFood, Steam — após validação do produto
	Futuro
	

1.3 Escopo da Fase 1 — MVP
A Fase 1 entrega o núcleo funcional do produto com os seguintes módulos:


* Autenticação (Login / Registro / Recuperação de senha)
* Dashboard Home com resumo financeiro e gráficos
* Gerenciamento de Transações (receitas e despesas)
* Gerenciamento de Cartões
* Gerenciamento de Metas financeiras
* Perfil do usuário


________________


2. Stack Tecnológica
2.1 Visão Geral da Arquitetura
O projeto é organizado como um monorepo com três camadas independentes: mobile, backend e dados. A camada de dados (schema Drizzle) é compartilhada entre o backend e o mobile via pacote interno, eliminando duplicação de tipos TypeScript.


Camada
	Tecnologia
	Função
	Mobile
	React Native + Expo Go
	Interface do usuário. Testado via QR code sem build nativo.
	Navegação
	Expo Router
	Roteamento baseado em arquivos (file-based routing).
	Estilização
	NativeWind
	Classes Tailwind no React Native.
	Estado global
	Zustand
	Gerenciamento de estado leve e tipado.
	Cache e fetch
	React Query (TanStack)
	Cache de requests, loading states, refetch automático.
	Backend
	Node.js + TypeScript + Express
	API REST. Deploy na Railway.
	Validação
	Zod
	Validação de entrada nas rotas da API.
	Autenticação
	JWT + bcrypt
	Tokens via httpOnly cookie.
	ORM
	Drizzle ORM + Drizzle Kit
	Queries tipadas, migrations e studio local.
	Banco de dados
	PostgreSQL via VPS
	Serverless Postgres. Free tier permanente (500 MB).
	Deploy
	Vercel (Frontend) + Railway (backend) + VPS (banco)
	Custo zero até validação do produto.
	

2.2 Justificativas Técnicas
Por que Expo Go e não bare React Native?
O Expo Go elimina toda a configuração de ambiente nativo (Android Studio, Xcode). O desenvolvimento e teste são feitos diretamente no celular via QR code. Para um app financeiro na Fase 1, o Expo Go cobre 100% das necessidades. Quando for necessário publicar nas lojas ou usar SDKs nativos avançados (OCR nativo, NFC), a migração para EAS Build é direta.


Por que Drizzle ORM e não TypeORM?
Drizzle oferece type safety superior: o schema é definido em TypeScript puro e os tipos das queries são inferidos automaticamente, sem decorators ou metadata. É mais leve, funciona melhor em ambientes serverless como o Neon, e o Drizzle Studio fornece uma interface gráfica local para inspecionar o banco sem ferramentas externas.


Por que monorepo?
O pacote packages/db contém o schema Drizzle e é importado tanto pela API quanto pelo mobile. Isso garante que os tipos das tabelas (User, Transaction, Card, Goal) estejam sempre em sincronia nos dois lados sem necessidade de duplicação ou geração de código.
2.3 GitHub
https://github.com/JaviDansen/controle_financeiro
2.4 Kanban (Trello)
https://trello.com/invite/b/6a04828869137d9804bc5c37/ATTI141ef6b1134beaa4d6617762ff2f23e7ED535267/meu-quadro-do-trello


3.1 Organização do Monorepo
O projeto utiliza npm workspaces para gerenciar três pacotes: o app mobile, a API backend e o pacote compartilhado de banco de dados.


Caminho
	Descrição
	finapp/
	Raiz do monorepo
	finapp/apps/mobile/
	Aplicativo React Native + Expo
	finapp/apps/mobile/app/
	Rotas via Expo Router (file-based)
	finapp/apps/mobile/app/(auth)/
	Telas de login e registro
	finapp/apps/mobile/app/(tabs)/
	Telas principais com navegação por abas
	finapp/apps/mobile/components/
	Componentes reutilizáveis
	finapp/apps/mobile/hooks/
	Custom hooks
	finapp/apps/mobile/store/
	Stores Zustand
	finapp/apps/mobile/services/
	Funções de chamada à API
	finapp/apps/api/
	Backend Node.js + Express
	finapp/apps/api/src/routes/
	Rotas da API REST
	finapp/apps/api/src/controllers/
	Lógica de negócio por módulo
	finapp/apps/api/src/services/
	Serviços e integrações
	finapp/apps/api/src/middlewares/
	Auth, validação, erros
	finapp/packages/db/
	Schema Drizzle + migrations (compartilhado)
	finapp/packages/db/schema/
	Definição das tabelas TypeScript
	finapp/packages/db/migrations/
	Arquivos de migration gerados pelo Drizzle Kit
	finapp/.env
	Variáveis de ambiente (DATABASE_URL, JWT_SECRET)
	

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
4. Token armazenado em httpOnly cookie ou SecureStore do Expo
5. React Query invalida cache e redireciona para a Home


Endpoints da API
Método
	Rota
	Descrição
	POST
	/auth/register
	Cria novo usuário
	POST
	/auth/login
	Autentica e retorna JWT
	POST
	/auth/logout
	Invalida sessão
	POST
	/auth/forgot-password
	Envia e-mail de recuperação
	POST
	/auth/reset-password
	Redefine senha com token
	

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
Dado
	Endpoint
	Cache (React Query)
	Resumo mensal (receitas, despesas, saldo)
	GET /dashboard/summary
	5 minutos
	Últimas transações
	GET /transactions?limit=5
	2 minutos
	Metas ativas com progresso
	GET /goals?active=true
	5 minutos
	Dados do usuário
	GET /users/me
	30 minutos
	

4.3 Módulo de Transações
Gerenciamento completo de receitas e despesas. É o módulo central do MVP.


Telas
* Lista de transações — filtros por tipo, categoria, data e cartão
* Detalhe da transação
* Formulário de criação / edição


Campos de uma transação
Campo
	Tipo
	Obrigatório
	Observação
	title
	string
	Sim
	Descrição da transação
	amount
	decimal
	Sim
	Valor sempre positivo
	type
	enum
	Sim
	'income' ou 'expense'
	category_id
	uuid FK
	Sim
	Categoria da transação
	card_id
	uuid FK
	Não
	Cartão utilizado (opcional)
	date
	date
	Sim
	Data da transação
	notes
	text
	Não
	Observações livres
	is_recurring
	boolean
	Sim
	Flag de recorrência (Fase 2)
	

Endpoints da API
Método
	Rota
	Descrição
	GET
	/transactions
	Lista com filtros e paginação
	POST
	/transactions
	Cria nova transação
	GET
	/transactions/:id
	Retorna transação por ID
	PATCH
	/transactions/:id
	Atualiza transação
	DELETE
	/transactions/:id
	Remove transação
	GET
	/transactions/summary
	Totais por tipo e categoria
	

4.4 Módulo de Cartões
Cadastro e acompanhamento de cartões de crédito e débito para categorização de transações.


Campos de um cartão
Campo
	Tipo
	Observação
	name
	string
	Nome do cartão (ex: Nubank)
	type
	enum
	'credit' ou 'debit'
	last_four
	string(4)
	Últimos 4 dígitos
	credit_limit
	decimal
	Limite (apenas cartões de crédito)
	closing_day
	int
	Dia de fechamento da fatura
	due_day
	int
	Dia de vencimento da fatura
	color
	string
	Cor de identificação visual (hex)
	

4.5 Módulo de Metas
Permite criar objetivos financeiros com valor alvo, prazo e acompanhamento de progresso.


Campos de uma meta
Campo
	Tipo
	Observação
	title
	string
	Nome da meta (ex: Viagem, Reserva)
	target_amount
	decimal
	Valor a ser atingido
	current_amount
	decimal
	Valor já acumulado
	deadline
	date
	Data limite (opcional)
	category
	string
	Categoria visual da meta
	is_active
	boolean
	Meta em andamento ou concluída
	

________________


5. Schema do Banco de Dados — Fase 1
5.1 Tabelas e Relacionamentos
Todas as tabelas utilizam UUID como chave primária e registram created_at e updated_at automaticamente.


Tabela
	Relações
	Observação
	users
	—
	Usuário autenticado
	categories
	belongs to users
	Categorias de transações por usuário
	cards
	belongs to users
	Cartões de crédito e débito
	transactions
	belongs to users, categories, cards
	Receitas e despesas
	goals
	belongs to users
	Metas financeiras
	

5.2 Campos Principais por Tabela


users
Coluna
	Tipo
	Restrição
	id
	uuid
	PK, default gen_random_uuid()
	name
	varchar(100)
	NOT NULL
	email
	varchar(255)
	NOT NULL, UNIQUE
	password_hash
	text
	NOT NULL
	created_at
	timestamp
	NOT NULL, default now()
	updated_at
	timestamp
	NOT NULL, default now()
	

transactions
Coluna
	Tipo
	Restrição
	id
	uuid
	PK
	user_id
	uuid
	FK → users.id, NOT NULL
	category_id
	uuid
	FK → categories.id, NOT NULL
	card_id
	uuid
	FK → cards.id, NULLABLE
	title
	varchar(200)
	NOT NULL
	amount
	numeric(12,2)
	NOT NULL, > 0
	type
	varchar(10)
	'income' | 'expense'
	date
	date
	NOT NULL
	notes
	text
	NULLABLE
	is_recurring
	boolean
	default false
	created_at
	timestamp
	NOT NULL
	

________________


6. Roteiro — Primeira Semana de Tasks
6.1 Visão Geral da Semana
A primeira semana tem como objetivo ter o ambiente completamente configurado, o banco de dados criado com schema real, a autenticação funcionando de ponta a ponta (mobile ↔ API ↔ banco) e a tela de Home com dados reais.


Dia
	Foco
	Entrega esperada
	Dia 1
	Setup de ambiente e monorepo
	Projeto criando, Expo rodando, API com hello-world
	Dia 2
	Schema do banco e conexão Neon
	Tabelas criadas no Neon, Drizzle Studio funcionando
	Dia 3
	Backend — módulo de autenticação
	Rotas /auth/* funcionando com JWT
	Dia 4
	Mobile — telas de autenticação
	Login e Registro conectados à API real
	Dia 5
	Backend — módulo de transações e categorias
	CRUD completo de transações
	Dia 6
	Mobile — Home e listagem de transações
	Dashboard com dados reais do banco
	Dia 7
	Revisão, ajustes e testes manuais
	Fluxo completo testado no celular via Expo Go
	

6.2 Tasks Detalhadas por Dia


Dia 1 — Setup de Ambiente e Monorepo
Tarefas
6. Instalar Node.js 20 LTS, Git, VS Code
7. Criar estrutura do monorepo: finapp/ com apps/ e packages/
8. Configurar package.json raiz com npm workspaces
9. Inicializar apps/api com Express + TypeScript + ts-node-dev
10. Criar rota GET /health que retorna { status: 'ok' }
11. Inicializar apps/mobile com npx create-expo-app
12. Testar Expo Go no celular via QR code
13. Criar repositório no GitHub e primeiro commit


Dia 2 — Schema do Banco e Neon
Tarefas
14. Criar conta no Neon (neon.tech) e novo projeto
15. Copiar a DATABASE_URL para o arquivo .env
16. Inicializar packages/db com Drizzle e drizzle-kit
17. Criar schema: users, categories, cards, transactions, goals
18. Rodar npx drizzle-kit generate para gerar migrations
19. Rodar npx drizzle-kit migrate para aplicar no Neon
20. Abrir Drizzle Studio (npx drizzle-kit studio) e verificar tabelas
21. Inserir categorias padrão (Alimentação, Transporte, Saúde, etc.) via seed


Dia 3 — Backend: Autenticação
Tarefas
22. Instalar jsonwebtoken, bcryptjs, zod no apps/api
23. Criar middleware de autenticação JWT
24. Implementar POST /auth/register com validação Zod
25. Implementar POST /auth/login com retorno de token
26. Implementar POST /auth/logout
27. Implementar GET /users/me (rota protegida de teste)
28. Testar todas as rotas com Insomnia ou Postman


Dia 4 — Mobile: Telas de Autenticação
Tarefas
29. Configurar Expo Router com grupos (auth) e (tabs)
30. Instalar NativeWind e configurar Tailwind no projeto
31. Criar tela de Login com formulário validado
32. Criar tela de Registro
33. Criar service de auth em services/auth.ts
34. Criar store Zustand para armazenar dados do usuário
35. Conectar login à API real e redirecionar para Home
36. Persistir token com Expo SecureStore


Dia 5 — Backend: Transações e Categorias
Tarefas
37. Implementar CRUD completo de categories
38. Implementar CRUD completo de transactions
39. Adicionar filtros por tipo, data e categoria nos listagens
40. Implementar GET /dashboard/summary (totais do mês)
41. Garantir que todas as rotas verificam o user_id do JWT
42. Testar com dados reais inseridos via API


Dia 6 — Mobile: Home e Transações
Tarefas
43. Instalar e configurar React Query no mobile
44. Criar tela Home com card de saldo e últimas transações
45. Criar tela de listagem de transações com filtros básicos
46. Criar formulário de nova transação (tipo, valor, categoria, data)
47. Criar hook useTransactions com React Query
48. Testar fluxo completo: criar transação → ver na Home


Dia 7 — Revisão e Ajustes
Tarefas
49. Testar fluxo completo no celular real via Expo Go
50. Corrigir bugs de layout em diferentes tamanhos de tela
51. Validar tratamento de erros na API (401, 404, 422)
52. Verificar que o token expira corretamente e faz logout
53. Revisar variáveis de ambiente e .env.example
54. Fazer deploy do backend na Railway
55. Documentar no README os passos de setup


________________


7. Setup Inicial Completo
7.1 Ferramentas para Instalar na Máquina


Ferramenta
	Versão
	Como instalar
	Finalidade
	Node.js
	20 LTS
	nodejs.org/en/download → Windows Installer
	Runtime do backend e scripts
	Git
	Mais recente
	git-scm.com/download/win
	Controle de versão
	VS Code
	Mais recente
	code.visualstudio.com
	Editor principal
	Expo Go (app)
	Mais recente
	Play Store / App Store no celular
	Testar o app mobile
	Insomnia
	Mais recente
	insomnia.rest/download
	Testar rotas da API
	WSL2 + Ubuntu
	Ubuntu 22.04
	wsl --install no PowerShell
	Terminal Linux no Windows
	

7.2 Extensões Recomendadas no VS Code


* ESLint — lint em tempo real
* Prettier — formatação automática
* Drizzle ORM — syntax highlight no schema
* Thunder Client — cliente HTTP integrado ao VS Code
* Expo Tools — suporte ao Expo Router
* GitLens — histórico de git inline


7.3 Painéis Externos (Cloud e Serviços)


Serviço
	URL
	Para que serve
	Custo
	Neon
	neon.tech
	Criar e gerenciar o PostgreSQL serverless
	Grátis (500 MB)
	Railway
	railway.app
	Deploy e hosting do backend Node.js
	Grátis ($5 crédito/mês)
	GitHub
	github.com
	Repositório e CI/CD futuro
	Grátis
	Expo EAS
	expo.dev
	Build para lojas (Fase futura)
	Grátis (limitado)
	

7.4 Configuração do Neon (Passo a Passo)


56. Acesse neon.tech e crie uma conta com GitHub ou Google
57. Clique em 'New Project', dê o nome finapp-db, selecione a região mais próxima (us-east-1 ou eu-central-1)
58. Na tela do projeto, clique em 'Connection string' e copie a URL completa
59. Cole no arquivo .env na raiz do projeto como DATABASE_URL='postgresql://...'
60. Nunca commite o arquivo .env — adicione ao .gitignore imediatamente
61. Para acessar o painel de tabelas: vá em 'Tables' no menu lateral do Neon
62. Para executar queries manuais: vá em 'SQL Editor'


7.5 Configuração da Railway (Passo a Passo)


63. Acesse railway.app e crie uma conta com GitHub
64. Clique em 'New Project' → 'Deploy from GitHub repo'
65. Autorize o Railway a acessar o repositório finapp
66. Selecione o repositório e aponte o root directory para apps/api
67. Em 'Variables', adicione as mesmas variáveis do .env (DATABASE_URL, JWT_SECRET, PORT)
68. A Railway detecta automaticamente Node.js e faz o build
69. Anote a URL pública gerada (ex: finapp-api.railway.app) — será usada no mobile


7.6 Comandos de Setup do Projeto


Criação do monorepo
mkdir finapp && cd finapp
npm init -y
echo '{"workspaces":["apps/*","packages/*"]}' >> package.json
Mobile
mkdir -p apps && cd apps
npx create-expo-app mobile --template blank-typescript
Backend
mkdir api && cd api && npm init -y
npm install express zod jsonwebtoken bcryptjs
Banco de dados (packages/db)
mkdir -p packages/db && cd packages/db && npm init -y
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
npx drizzle-kit generate   # gera migrations
npx drizzle-kit migrate    # aplica no Neon
npx drizzle-kit studio     # abre GUI local




FinApp — Documentação Técnica v1.0  ·  Maio 2026