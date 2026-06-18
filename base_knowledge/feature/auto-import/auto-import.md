# Feature — Importação Automática de Transações

## Objetivo

Permitir que o usuário registre múltiplas transações de uma vez, sem precisar preencher cada uma manualmente. O sistema lê screenshots de extratos bancários, extrai os dados via LLM e apresenta uma lista de revisão antes de salvar.

---

## Fluxo Completo

```
Usuário seleciona o banco
        ↓
Seleciona screenshot na galeria do celular
        ↓
Mobile envia imagem para a API FinApp
        ↓
Backend calcula hash SHA-256 da imagem
        ↓
Hash já existe no banco? → rejeita, avisa o usuário (LLM não é chamada)
        ↓
Backend envia imagem para a LLM (GPT-4 Vision ou Gemini Vision)
        ↓
LLM extrai as transações e retorna estrutura bruta
        ↓
Backend trata e normaliza no contrato de transações do FinApp
        ↓
Backend salva o hash no banco e retorna a lista ao mobile
        ↓
Usuário revisa: edita, exclui ou mantém cada item
        ↓
Usuário escolhe categoria (sistema sugere por similaridade de texto)
        ↓
Usuário confirma → transações salvas no FinApp
```

---

## Modelos de Coleta por Banco

Cada banco exporta extratos em formatos e layouts diferentes. O sistema opera com **modelos de coleta específicos por instituição** — o usuário seleciona o banco antes de importar, e o modelo correspondente define como os dados serão interpretados.

Isso permite que novos bancos sejam adicionados sem alterar a arquitetura central.

### Bancos Suportados

| Banco | Screenshot | CSV | PDF |
|---|---|---|---|
| Mercado Pago | ✅ Fase 1 | 🔜 Planejado | 🔜 Planejado |

> A arquitetura deve suportar os três formatos desde o início — screenshot é o ponto de entrada, CSV e PDF serão adicionados sem redesenho.

---

## Decisões Técnicas

### Entrada de dados
- **Fase 1:** galeria do celular
- **Fases futuras:** câmera e clipboard

### Extração via LLM
- A imagem nunca vai direto para a LLM pelo mobile — passa sempre pelo backend
- O backend é responsável por chamar a LLM, tratar a resposta e devolver ao mobile no contrato estabelecido de transações
- LLM candidatas: GPT-4 Vision (OpenAI) ou Gemini Vision (Google)
- A chave da API da LLM fica exclusivamente no backend — nunca exposta no app

### Prevenção de duplicatas
- Backend calcula **hash SHA-256** da imagem ao recebê-la
- Hash é salvo no banco vinculado ao `userId`
- Se o mesmo hash já existir para aquele usuário, a requisição é rejeitada antes de chamar a LLM — sem custo de API
- Limitação conhecida: screenshots diferentes da mesma tela geram hashes diferentes (não detectadas como duplicata)

### Sugestão de categoria
- **Sem LLM** — processamento local no backend
- Compara a descrição de cada transação extraída com os nomes das categorias existentes do usuário por **similaridade de texto**
- Exibida apenas como recomendação na tela de revisão — o usuário sempre escolhe a categoria final

---

## Tela de Revisão (Mobile)

Após o backend retornar a lista extraída, o usuário vê todas as transações antes de confirmar.

**Ações disponíveis por item:**
- Editar (título, valor, data)
- Excluir da lista
- Selecionar / trocar categoria (com sugestão destacada)

**Confirmação:** única ação ao final que salva todos os itens restantes na lista.

---

## Contrato de Dados

O backend retorna as transações extraídas no mesmo shape já estabelecido no sistema:

```ts
type TransacaoExtraida = {
  title: string
  amount: number
  type: 'income' | 'expense'
  date: string           // ISO: 'YYYY-MM-DD'
  categoryId: string | null   // null quando não há sugestão
  suggestedCategoryId: string | null
  notes: string | null
}

type ImportResponse = {
  data: {
    transactions: TransacaoExtraida[]
    imageHash: string
    bank: string
  }
}
```

---

## O que Ainda Precisa ser Definido

- [ ] Schema do banco para armazenar os hashes de imagem
- [ ] Algoritmo de similaridade de texto para sugestão de categoria (ex: distância de Levenshtein, match por palavras-chave)
- [ ] Prompt da LLM para cada banco (o modelo do Mercado Pago precisa de um prompt específico)
- [ ] Rota da API: `POST /transactions/import`
- [ ] Como armazenar temporariamente a imagem no backend durante o processamento
- [ ] UX dos estados de loading durante a extração (pode demorar 3–10s)
