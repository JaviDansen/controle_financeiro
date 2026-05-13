# Skill: /doc-technical-reviewer

Mantém o documento `OFFICIAL-FinApp_Documentacao_Tecnica` no Google Docs sempre sincronizado com o estado real do código, comparando git diffs com o conteúdo atual da documentação.

## Quando usar

`/doc-technical-reviewer` — após um conjunto de commits relevantes que alteraram arquitetura, rotas, schemas, dependências ou configurações do projeto.

## O que esta skill faz

1. Baixa o Google Doc para `base_knowledge/technical/` como arquivo `.md`
2. Lê o conteúdo atual da documentação
3. Analisa os diffs recentes do Git para identificar o que mudou no código
4. Edita o arquivo local com as atualizações necessárias
5. Envia o conteúdo atualizado de volta ao Google Docs
6. Apaga e re-baixa o arquivo para confirmar a sincronização
7. Commita e faz push de `base_knowledge/technical/`

---

## Fluxo de execução

### Passo 1 — Download do documento

```bash
npx ts-node apps/api/src/scripts/export-doc.ts
```

Salva em: `base_knowledge/technical/OFFICIAL-FinApp_Documentacao_Tecnica.md`

---

### Passo 2 — Ler o documento local

Usar a ferramenta **Read** para ler o conteúdo de:
`base_knowledge/technical/OFFICIAL-FinApp_Documentacao_Tecnica.md`

---

### Passo 3 — Analisar diffs do Git

Executar os comandos abaixo para entender o que mudou:

```bash
git log --oneline -20
```

```bash
git diff HEAD~5
```

Ajustar o número de commits (`HEAD~N`) com base no que foi feito desde a última revisão da documentação. Focar em:

- Novos arquivos criados (`apps/api/src/`, `apps/mobile/app/`, `packages/db/schema/`)
- Dependências adicionadas (`package.json`)
- Configurações alteradas (`.env.example`, `CLAUDE.md`, `.gitignore`)
- Rotas, schemas, telas ou serviços novos ou modificados

---

### Passo 4 — Editar o arquivo local

Usar as ferramentas **Edit** ou **Write** para atualizar `base_knowledge/technical/OFFICIAL-FinApp_Documentacao_Tecnica.md` com:

- Seções novas para funcionalidades adicionadas
- Atualização de versões de dependências
- Novos endpoints documentados
- Schemas ou tabelas adicionadas
- Configurações de ambiente novas

**Regras de edição:**
- Nunca remover seções existentes — apenas atualizar ou adicionar
- Manter o mesmo tom e estrutura do documento original
- Registrar a data da atualização no rodapé ou cabeçalho do documento

---

### Passo 5 — Enviar de volta ao Google Docs

```bash
npx ts-node apps/api/src/scripts/update-doc.ts
```

Este script lê o arquivo local e substitui todo o conteúdo do Google Doc.

---

### Passo 6 — Substituir arquivo local (confirmar sincronização)

Deletar o arquivo atual:
```bash
rm base_knowledge/technical/OFFICIAL-FinApp_Documentacao_Tecnica.md
```

Re-baixar do Google Docs (confirma que a atualização foi aplicada):
```bash
npx ts-node apps/api/src/scripts/export-doc.ts
```

---

### Passo 7 — Commit e Push

Acionar o agente **commit-writer** para commitar `base_knowledge/technical/` com um `[DOCS]` descrevendo o que foi atualizado na documentação.

Após o commit:
```bash
git push origin develop
```

---

## Scripts auxiliares

| Script | O que faz |
|---|---|
| `apps/api/src/scripts/export-doc.ts` | Baixa o Google Doc como texto para `base_knowledge/technical/` |
| `apps/api/src/scripts/update-doc.ts` | Envia o conteúdo local de volta ao Google Docs |

## Serviços utilizados

| Função | Arquivo |
|---|---|
| `findDocumentId()` | `apps/api/src/services/docs.service.ts` |
| `exportDocument()` | `apps/api/src/services/docs.service.ts` |
| `replaceDocumentContent()` | `apps/api/src/services/docs.service.ts` |
| `googleAuth` | `apps/api/src/services/google-auth.service.ts` |

## Regras

- Sempre usar `npx ts-node` — nunca compilar manualmente antes de rodar os scripts
- O arquivo local em `base_knowledge/technical/` é temporário de trabalho — o Google Docs é a fonte de verdade
- O re-download no Passo 6 é obrigatório para garantir que o arquivo local reflita exatamente o que está no Google Docs
- Não commitar sem re-baixar primeiro
