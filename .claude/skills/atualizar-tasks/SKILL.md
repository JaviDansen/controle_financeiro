# Skill: atualizar-tasks

Atualiza o arquivo `base_knowledge/tasks.html` com as novas implementações concluídas no projeto FinApp.

## Quando usar

`/atualizar-tasks` — após concluir qualquer implementação relevante (nova rota, nova tela, nova tabela, nova configuração, refactor significativo, etc.)

## O que esta skill faz

1. Lê o estado atual do `base_knowledge/tasks.html`
2. Identifica o que foi implementado na conversa atual (ou pedido pelo usuário)
3. Adiciona o bloco HTML da nova task no grupo correto
4. Atualiza o footer com a data atual
5. O contador de tasks e arquivos é atualizado automaticamente pelo JavaScript já existente

## Como identificar o grupo da task

| Grupo | Quando usar |
|---|---|
| `Setup & Configuração` | `.gitignore`, `.npmrc`, `package.json`, CI/CD, variáveis de ambiente |
| `Backend — API` | Rotas, controllers, middlewares, autenticação, validação |
| `Banco de Dados — Drizzle ORM` | Schema, migrations, seed, conexão |
| `Mobile — React Native + Expo` | Telas, hooks, stores, components, services mobile |
| `Ambiente de Agentes` | CLAUDE.md, skills, settings, base_knowledge |

Se precisar de um novo grupo, crie um bloco `<div class="phase">` seguindo o padrão existente.

## Bloco HTML de uma nova task

Inserir dentro do `<div class="task-list">` do grupo correto:

```html
<div class="task">
  <div class="task-check">
    <svg viewBox="0 0 10 10" fill="none">
      <polyline points="1.5,5 4,7.5 8.5,2.5" stroke="#6ee7b7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>
  <div class="task-body">
    <div class="task-name">NOME DA TASK</div>
    <div class="task-desc">Descrição clara do que foi implementado, quais arquivos foram criados ou modificados e qual problema resolve.</div>
    <div class="task-meta">
      <span class="tag TAG_CLASS">LABEL</span>
      <span class="task-date">DD mmm AAAA</span>
    </div>
  </div>
</div>
```

## Classes de tag disponíveis

| Classe | Cor | Usar para |
|---|---|---|
| `tag-api` | azul | Rotas, controllers, middlewares |
| `tag-mobile` | roxo | Telas, hooks, components mobile |
| `tag-db` | verde | Schema, migrations, seed |
| `tag-config` | amarelo | Configurações, setup, CI |
| `tag-agents` | lilás | CLAUDE.md, skills, base_knowledge |

## Atualizar o footer

Alterar a linha do footer para refletir a data da última atualização:

```html
<footer>
  FinApp · Fase 1 MVP · Atualizado em DD mmm AAAA
</footer>
```

## Atualizar a lista de arquivos no script

No bloco `<script>` ao final do HTML, adicionar os novos arquivos criados ao array `files`:

```js
const files = [
  // ... arquivos existentes ...
  'caminho/do/novo/arquivo.ts',
]
```

## Regras

- **Sempre** usar a data atual (disponível no CLAUDE.md como `currentDate`)
- Descrição da task deve mencionar os arquivos principais criados/alterados
- Não remover tasks existentes — o arquivo é um histórico cumulativo
- Manter a ordem cronológica dentro de cada grupo
- Se a implementação abrangeu múltiplos grupos, criar uma task em cada grupo correspondente
- Tasks triviais (correção de typo, ajuste de margem) não precisam ser registradas — focar em implementações que mudam comportamento ou adicionam funcionalidade
