# Feature — Importação Automática de Transações

## Objetivo

Permitir que o usuário registre múltiplas transações de uma vez, sem precisar preencher cada uma manualmente. O sistema lê arquivos de extrato (screenshot, PDF, CSV, XLS, XLSX), extrai os dados e apresenta uma lista de revisão antes de salvar.

---

## Fluxo Completo

```
Usuário seleciona o banco
        ↓
Seleciona o arquivo de extrato na galeria ou gerenciador de arquivos
        ↓
Mobile envia o arquivo para a API FinApp
        ↓
Backend calcula hash SHA-256 do arquivo
        ↓
Hash já existe no banco? → rejeita, avisa o usuário (processamento não é chamado)
        ↓
Backend processa o arquivo:
  - Screenshot → envia para LLM Vision
  - CSV/XLS/XLSX → parser local por banco
  - PDF → extrai texto e envia para LLM ou parser local
        ↓
Extrai as transações e normaliza no contrato do FinApp
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

| Banco | Método | Status |
|---|---|---|
| Mercado Pago | CSV exportado manualmente pelo usuário | 🔜 Planejado |
| Outros bancos | Screenshot → LLM | 🔜 Padrão planejado |

> **Nota (2026-06-19):** A API OAuth do Mercado Pago foi avaliada e descartada. O endpoint `/v1/payments/search` retorna apenas transações digitais (Pix, QR Code) — transações físicas com cartão não aparecem. A única forma confiável de importar o histórico completo é via extrato CSV exportado manualmente pelo usuário no app/site do MP.

---

## Mercado Pago — Estratégia CSV

O usuário exporta o extrato manualmente pelo site ou app do Mercado Pago e importa o arquivo `.csv` no FinApp.

### Colunas relevantes do CSV exportado

| Coluna | Uso |
|---|---|
| `DATA` | Data da transação |
| `DESCRIÇÃO` | Nome do estabelecimento / descrição |
| `TIPO` | Tipo de movimentação (ex: "Pagamento com cartão") |
| `QUANTIA` | Valor (positivo = entrada, negativo = saída) |
| `NÚMERO DE REFERÊNCIA` | ID único — usado para deduplicação |

---

## Decisões Técnicas

### Entrada de dados
- **Fase 1:** galeria do celular / gerenciador de arquivos
- **Fases futuras:** câmera e clipboard

### Extração via LLM (screenshots e PDFs sem estrutura)
- O arquivo nunca vai direto para a LLM pelo mobile — passa sempre pelo backend
- O backend é responsável por chamar a LLM, tratar a resposta e devolver ao mobile no contrato estabelecido de transações
- LLM candidatas: GPT-4 Vision (OpenAI) ou Gemini Vision (Google)
- A chave da API da LLM fica exclusivamente no backend — nunca exposta no app

### Extração via parser local (CSV, XLS, XLSX)
- Parsers específicos por banco, sem custo de API externa
- Cada parser mapeia as colunas do formato do banco para o contrato interno do FinApp
- Arquivo CSV do Mercado Pago: parser dedicado com mapeamento das colunas acima

### Prevenção de duplicatas
- Backend calcula **hash SHA-256** do arquivo ao recebê-lo
- Hash é salvo no banco vinculado ao `userId`
- Se o mesmo hash já existir para aquele usuário, a requisição é rejeitada — sem reprocessamento
- Para CSVs: adicionalmente verificar `NÚMERO DE REFERÊNCIA` por `userId` antes de inserir cada linha

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

## Schema do Banco

### `import_images`
Armazena o hash de cada arquivo enviado. Consultada antes de processar como portão anti-duplicata.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_hash` | varchar(64) | SHA-256 do arquivo |
| `bank` | varchar(50) | ex: `'mercadopago'` |
| `format` | varchar(20) | `'screenshot'` \| `'csv'` \| `'pdf'` \| `'xls'` \| `'xlsx'` |
| `status` | varchar(20) | `'processed'` \| `'failed'` |
| `created_at` | timestamp | |

Índice único em `(user_id, image_hash)` — dois usuários podem ter o mesmo arquivo sem conflito.

### `import_sessions`
Registra cada importação concluída. Permite histórico e análise de qualidade.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_id` | uuid FK → import_images | cascade delete |
| `extracted_count` | integer | quantas transações foram extraídas |
| `confirmed_count` | integer | quantas o usuário confirmou |
| `created_at` | timestamp | |

---

## O que Ainda Precisa ser Definido

- [ ] Algoritmo de similaridade de texto para sugestão de categoria (ex: distância de Levenshtein, match por palavras-chave)
- [ ] Prompt da LLM para extratos em screenshot (por banco)
- [ ] Parser CSV do Mercado Pago — mapeamento completo das colunas e normalização de valores
- [ ] Como armazenar temporariamente o arquivo no backend durante o processamento
- [ ] UX dos estados de loading durante a extração (pode demorar 3–10s para LLM)
- [ ] Deduplicação por `NÚMERO DE REFERÊNCIA` do MP além do hash do arquivo
