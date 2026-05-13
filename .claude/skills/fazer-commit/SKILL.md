# Skill: fazer-commit

## REGRA ABSOLUTA

**Nunca execute `git commit` diretamente.** Sempre que houver necessidade de fazer um commit — seja após implementar uma feature, corrigir um bug, refatorar código ou qualquer outra alteração — o agente `commit-writer` deve ser acionado.

## Quando esta regra se aplica

Esta regra se aplica em **qualquer** das seguintes situações:

- Ao final de uma implementação (nova rota, nova tela, novo schema, etc.)
- Após correção de bug ou ajuste de comportamento
- Após refatoração ou reorganização de código
- Após alterações de configuração (`.gitignore`, `package.json`, `tsconfig.json`, etc.)
- Quando o usuário pede explicitamente para "commitar", "fazer commit" ou "salvar no git"
- Ao final de qualquer skill (`/nova-rota`, `/nova-tela`, `/novo-schema`, `/migrar-db`, etc.)

## Como acionar o commit-writer

Use o Agent tool com `subagent_type: "commit-writer"`:

```
Agent({
  subagent_type: "commit-writer",
  description: "Gerar commit para as alterações implementadas",
  prompt: "Analise o diff das alterações recentes no projeto FinApp e gere um commit message preciso seguindo o padrão [TYPE] - Texto. Contexto do que foi implementado: <descrever brevemente o que foi feito>"
})
```

## Por que usar o commit-writer e não commitar direto

O agente `commit-writer`:

1. **Lê o diff real** antes de escrever a mensagem — não assume, analisa o código
2. **Classifica o tipo correto** (`[FEAT]`, `[FIX]`, `[CHORE]`, `[REFACTOR]`, etc.)
3. **Verifica coesão** — se as mudanças são de naturezas diferentes, sugere splits em commits separados
4. **Aplica checklist de qualidade** — título ≤ 100 chars, formato `[TYPE] - Texto`, imperativo
5. **Acumula conhecimento do projeto** via memória persistente — fica mais preciso com o tempo

## Fluxo correto após qualquer implementação

```
1. Implementação concluída
2. → Rodar /atualizar-tasks (se for implementação relevante)
3. → Acionar commit-writer para gerar e executar o commit
4. → git push (se solicitado pelo usuário)
```

## O que NÃO fazer

- ❌ `git add . && git commit -m "alguma coisa"` diretamente
- ❌ Escrever a mensagem de commit sem analisar o diff
- ❌ Usar mensagens genéricas como "update", "fix", "changes", "ajustes"
- ❌ Commitar sem verificar se há arquivos sensíveis (`.env`) no stage
