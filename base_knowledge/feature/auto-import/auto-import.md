# Feature — Importação Automática de Transações

## Objetivo

Permitir que o usuário registre múltiplas transações de uma vez, sem precisar preencher cada uma manualmente. O sistema lê arquivos de extrato (screenshot, PDF, CSV, XLS, XLSX), extrai os dados e apresenta uma lista de revisão antes de salvar.

---

## Fluxo Completo

```
Usuário seleciona o banco
        ↓
Seleciona o validador de data (Gemini ou Tesseract)
        ↓
Seleciona os arquivos de extrato (imagens ou documentos — múltipla seleção)
        ↓
Mobile envia cada arquivo (base64) para a API FinApp
        ↓
Backend calcula hash SHA-256 do arquivo
        ↓
Hash já existe no banco? → rejeita com 409, avisa o usuário
        ↓
Backend salva o arquivo em disco (pasta data_import/)       ← [SIMULADO — ver nota abaixo]
        ↓
Backend valida se a imagem tem cabeçalho de data visível
  - Sem cabeçalho → rejeita com 400 (header_not_found), sem chamar o Gemini
        ↓
Backend extrai as transações:
  - Screenshot → Gemini Vision (prompt por banco)
  - CSV/XLS/XLSX → parser local por banco (a implementar)
  - PDF → a definir
        ↓
Backend salva transações extraídas em import_extracted_transactions
Backend salva tokens consumidos e custo em BRL em import_images
        ↓
Retorna transactions[] ao mobile
        ↓
Mobile exibe lista das transações extraídas (somente não-skipped)
        ↓
[PRÓXIMO] Usuário revisa: edita, exclui ou mantém cada item
        ↓
[PRÓXIMO] Usuário escolhe categoria (sistema sugere por similaridade)
        ↓
[PRÓXIMO] Usuário confirma → POST /import/confirm → salvo em transactions
```

---

## ⚠️ AVISO — Armazenamento Simulado (Fase Atual)

> **Esta fase implementa a lógica completa do fluxo usando uma pasta local (`apps/api/data_import/`) como depósito temporário de arquivos.**
>
> **Isso é uma simulação e NÃO deve ser mantido em produção.**
>
> É uma dívida técnica intencional e explícita. O objetivo é validar toda a lógica de extração, parsing e revisão antes de resolver a infraestrutura de armazenamento.

### O que está simulado

| Responsabilidade | Hoje (simulado) | Produção (obrigação futura) |
|---|---|---|
| Armazenamento de arquivos | Pasta local `data_import/` no servidor | S3, R2, GCS ou similar |
| Referência no banco | Caminho relativo em disco | URL pública ou chave do bucket |
| Limpeza de arquivos | Manual / sem política | TTL automático (ex: 7 dias após confirmação) |
| Acesso aos arquivos | Direto pelo filesystem | URL assinada com expiração |
| Escalabilidade | Nenhuma — tudo no mesmo processo | Workers separados por tipo de arquivo |

### Estrutura da pasta simulada

```
apps/api/
└── data_import/            ← ignorada pelo .gitignore, não vai para o repo
    ├── images/             ← screenshots (.jpg, .png, .webp)
    │   └── {userId}/
    │       └── {imageId}.{ext}
    └── documents/          ← PDFs, CSVs, XLS, XLSX
        └── {userId}/
            └── {imageId}.{ext}
```

O `imageId` é o UUID gerado pela inserção em `import_images` — cria o vínculo direto entre o arquivo em disco e o registro no banco sem mapeamento extra.

### Obrigações antes de ir para produção

- [ ] **Migrar para object storage** (S3/R2/GCS) — substituir escrita em disco por upload para bucket
- [ ] **Salvar URL/chave do bucket** na coluna `file_path` de `import_images` em vez de caminho local
- [ ] **Política de TTL** — deletar arquivo após N dias da confirmação ou falha definitiva
- [ ] **URLs assinadas** — nunca expor o arquivo diretamente; gerar URL temporária quando necessário
- [ ] **Separar processamento em worker** — o upload e parsing não devem bloquear o request HTTP
- [ ] **Limpar `data_import/` do servidor** antes de qualquer deploy em produção

---

## Modelos de Coleta por Banco

Cada banco exporta extratos em formatos e layouts diferentes. O sistema opera com **modelos de coleta específicos por instituição** — o usuário seleciona o banco antes de importar, e o modelo correspondente define como os dados serão interpretados.

### Bancos Suportados

| Banco | Método | Status |
|---|---|---|
| Mercado Pago | Screenshot → Gemini Vision | ✅ Implementado |
| A definir | CSV exportado manualmente | 🔜 Planejado |

---

## Plano de Implementação

### Etapa 1 — Recepção e salvamento do arquivo ✅ Concluída

- Mobile envia `fileBase64` + metadados via `POST /import/extract`
- Backend valida com Zod, calcula hash SHA-256, verifica duplicata
- Decodifica base64 e salva em `data_import/{images|documents}/{userId}/{imageId}.{ext}`
- Salva caminho relativo em `import_images.file_path`
- Insere em `import_images` (status `'pending'`) e `import_sessions`
- Log `import.received` (tamanho do payload) e `import.file_saved` (caminho)

### Etapa 2 — Parser CSV (genérico) 🔜 Pendente

- [ ] Ler o arquivo salvo em disco a partir do `file_path`
- [ ] Parsear colunas de acordo com o banco selecionado (mapeamento a definir por banco)
- [ ] Normalizar valores: vírgula → ponto, sinal negativo → `type: 'expense'`
- [ ] Deduplicação por ID de referência do banco (coluna específica por banco)
- [ ] Retornar array `TransacaoExtraida[]` no contrato estabelecido

### Etapa 3 — Pré-validação da imagem ✅ Concluída

Antes de chamar o Gemini para extração, o backend valida se a imagem contém um **cabeçalho de data visível**. Sem ele, a extração não tem como associar data às transações — a chamada seria desperdiçada.

**Regra absoluta:** se nenhum cabeçalho de data for encontrado, a imagem é rejeitada imediatamente, sem chamar o Gemini de extração. O mobile exibe erro claro ao usuário.

**Erro retornado pela API quando validação falha:**
```json
{ "error": "header_not_found", "message": "A imagem não contém um cabeçalho de data visível." }
```

#### Estratégias de validação — resultado dos testes

Dois modelos foram implementados e testados em 6 imagens reais. A estratégia ativa é controlada pelo campo `validationStrategy` enviado pelo mobile (e pela env `GEMINI_VALIDATION_STRATEGY` como default).

| Estratégia | Como funciona | Custo | Resultado nos testes |
|---|---|---|---|
| `tesseract` | OCR local com `tesseract.js` — detecta padrão de data no texto extraído | Zero | **6/6 corretas (100%)** — padrão atual |
| `gemini` | Chamada ao Gemini Flash com prompt curtíssimo: "existe cabeçalho de data?" | ~R$ 0,001/imagem | 5/6 corretas (83%) — 1 falso positivo |

**Tesseract é o padrão** por ter acerto perfeito no conjunto de teste e custo zero. Gemini permanece disponível para comparação.

#### Arquitetura do validador

```
apps/api/src/services/gemini/validator/
├── index.ts                     ← validateImageHasDateHeader(path, strategy?)
├── gemini-validator.ts          ← validação via Gemini Flash
├── tesseract-validator.ts       ← validação via OCR local
└── date-header-detector.ts      ← lógica OCR: normalização, score por linha, detecção de mês
```

O `date-header-detector.ts` é o núcleo do Tesseract:
- Remove acentos, trata `|` como `l` (ruído de OCR)
- Score 5 → match exato (`"Hoje"`, `"19 de junho"`)
- Score 3 → match em linha curta com padrão de data
- Válido quando score ≥ 3
- Cobre nomes completos e abreviações de mês (`jan`, `fev`...)

**Testes:** `tests/validator_tesseract_unit_test.ts` — 26 testes (18 unitários puros + 8 com imagens reais).

### Etapa 4 — Extração via Gemini Vision ✅ Concluída

**LLM:** Gemini 2.5 Flash (configurável via `GEMINI_MODEL` no `.env`)

**Custo real medido:** ~R$ 0,007 por imagem com 6 transações (1.888 tokens de entrada, 678 de saída).

**Taxa de câmbio:** obtida em tempo real via `open.er-api.com/v6/latest/USD`, cache de 24h em memória. Fallback para `USD_TO_BRL` no `.env`.

#### Arquitetura do serviço Gemini

```
apps/api/src/services/gemini/
├── gemini.client.ts             ← instância do SDK, exporta GEMINI_MODEL
├── gemini.service.ts            ← extractFromImage() — lê arquivo, chama Gemini, parseia JSON
├── types.ts                     ← TransacaoExtraida, ExtractionResult, GeminiUsage, ValidationResult
├── validator/                   ← (ver Etapa 3)
└── prompts/
    ├── index.ts                 ← getPrompt(bank, format)
    └── banks/
        └── mercadopago.ts       ← prompt completo com regras de data, reservas e cancelados
```

#### Prompt Mercado Pago — regras implementadas

1. **Cabeçalho de data acima** → `date_inferred: false`
2. **Sem cabeçalho acima, com cabeçalho abaixo** → data = dia seguinte ao cabeçalho encontrado, `date_inferred: true`
3. **`amount` sempre positivo** — `type` determina o sinal (verde = income, vermelho = expense)
4. **Reservas automáticas** ("Guardar ao gastar", "Reserva") → `skipped: true, skip_reason: "Reserva automática"` — são transferências internas do cofre MP, não afetam saldo real
5. **Cancelados** → `skipped: true, skip_reason: "Cancelado"`
6. **"Meli Dólar" (Cashback)** → incluir como `type: 'income'` — é entrada real
7. **Transações cortadas no rodapé** → incluir se título + valor legíveis
8. **`payment_method`** extraído da linha de descrição quando visível

#### O que é salvo no banco após extração

- `import_images`: `status = 'processed'`, `tokens_prompt`, `tokens_output`, `tokens_total`, `cost_brl`
- `import_extracted_transactions`: uma linha por transação extraída (incluindo skipped)
- `import_sessions`: `extracted_count` atualizado

### Etapa 5 — Sugestão de categoria 🔜 Pendente

- [ ] Após extração, comparar `title` de cada transação com os nomes das categorias do usuário
- [ ] Algoritmo: similaridade por palavras-chave ou Levenshtein (sem LLM)
- [ ] Preencher `categoryId` em `import_extracted_transactions` quando confiança > threshold
- [ ] Incluir `suggestedCategoryId` no retorno da API

### Etapa 6 — Tela de revisão (Mobile) 🔜 Pendente

- [ ] Exibir lista editável das transações extraídas (atualmente só exibe, sem edição)
- [ ] Cada item: editar título, valor, data; trocar/selecionar categoria
- [ ] Diferenciar visualmente itens com `date_inferred: true` (aviso de data incerta)
- [ ] Mostrar itens `skipped` com visual diferente (riscado ou separado)
- [ ] Excluir item da lista antes de confirmar
- [ ] Botão "Confirmar tudo" → `POST /import/confirm`
- [ ] Loading state durante extração (leva 3–10s)

### Etapa 7 — Confirmação e salvamento 🔜 Pendente

- [ ] `POST /import/confirm` recebe array revisado pelo usuário
- [ ] Insere cada item confirmado em `transactions` com `userId`
- [ ] Preenche `import_extracted_transactions.transaction_id` com o ID criado
- [ ] Atualiza `import_extracted_transactions.status` para `'confirmed'` ou `'discarded'`
- [ ] Atualiza `import_sessions.confirmed_count`
- [ ] Retorna resumo: quantas salvas, quantas ignoradas

---

## Mobile — Tela de Importação

Arquivo: `apps/mobile/app/(tabs)/import-extract.tsx`

### Seções da tela

1. **Banco** — seleção do banco (atualmente só Mercado Pago)
2. **Validador de data** — toggle Tesseract / Gemini (controla `validationStrategy` enviado à API)
3. **Arquivos** — seleção múltipla de imagens ou documentos; lista com status por arquivo após envio
4. **Transações extraídas** — lista das transações retornadas (somente não-skipped); badge "DATA?" para `date_inferred: true`
5. **Envios anteriores** — galeria de todas as imagens já enviadas; ao clicar abre modal com detalhes

### Modal de detalhes (bottom-sheet)

Abre ao clicar em qualquer card da galeria "Envios anteriores":
- Banco, data, status (processado / falhou / pendente)
- Contador de transações extraídas
- Preview das 3 primeiras transações (título, data, valor)
- Botão **Reanalisar** → `POST /import/reanalyze/:imageId` com o validador atualmente selecionado

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/import/extract` | Recebe arquivo, valida, extrai e salva |
| `GET` | `/import/history` | Lista as últimas 50 imagens do usuário com preview de 3 transações |
| `POST` | `/import/reanalyze/:imageId` | Reanalisa imagem já salva no disco |
| `POST` | `/import/confirm` | *(a implementar)* Confirma transações revisadas pelo usuário |

### Body de `/import/extract`

```ts
{
  bank: 'mercadopago'
  format: 'screenshot' | 'csv' | 'pdf' | 'xls' | 'xlsx'  // default: 'screenshot'
  fileBase64: string        // base64 do arquivo
  fileName?: string
  mimeType?: string
  validationStrategy?: 'gemini' | 'tesseract'  // default: 'tesseract'
}
```

---

## Contrato de Dados

### DTO de saída do Gemini — `TransacaoExtraida`

```ts
type TransacaoExtraida = {
  title: string              // "Extra Farma 7037", "Jacqueline Vidigal Leao"
  description: string        // "Pagamento com Pix", "Visa crédito", "Pix recebido"
  amount: number             // sempre positivo: 33.16
  type: 'income' | 'expense' // verde/+ = income, vermelho/- = expense
  date: string               // ISO: "2026-06-19"
  time: string               // "14h06" — não persiste no banco
  date_inferred: boolean     // true quando data foi inferida do cabeçalho anterior
  payment_method: string | null
  skipped: boolean           // true para reservas automáticas e cancelados
  skip_reason: string | null // "Reserva automática" | "Cancelado"
}
```

### Regras de inferência de data

1. **Cabeçalho de data visível acima** → `date_inferred: false`
2. **Sem cabeçalho acima, com cabeçalho abaixo** → date = dia seguinte ao cabeçalho, `date_inferred: true`
   - Ex: cabeçalho "31 de maio" está abaixo → transações acima são de "1 de junho"
3. **Sem nenhum cabeçalho visível** → imagem rejeitada antes de chamar o Gemini (`header_not_found`)

---

## Schema do Banco

### `import_images`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_hash` | varchar(64) | SHA-256 do arquivo — único por usuário |
| `bank` | varchar(50) | `'mercadopago'` |
| `format` | varchar(20) | `'screenshot'` \| `'csv'` \| `'pdf'` \| `'xls'` \| `'xlsx'` |
| `status` | varchar(20) | `'pending'` \| `'processed'` \| `'failed'` |
| `file_path` | varchar(500) | caminho local (simulado) → URL do bucket (produção) |
| `tokens_prompt` | integer | tokens de entrada da chamada Gemini |
| `tokens_output` | integer | tokens de saída da chamada Gemini |
| `tokens_total` | integer | total (inclui thinking tokens do modelo) |
| `cost_brl` | numeric(10,6) | custo estimado em reais com câmbio real |
| `created_at` | timestamp | |

Índice único em `(user_id, image_hash)`.

### `import_sessions`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_id` | uuid FK → import_images | cascade delete |
| `extracted_count` | integer | quantas transações foram extraídas |
| `confirmed_count` | integer | quantas o usuário confirmou |
| `created_at` | timestamp | |

### `import_extracted_transactions`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `image_id` | uuid FK → import_images | cascade delete |
| `user_id` | uuid FK → users | cascade delete |
| `title` | varchar(200) | extraído pelo Gemini |
| `description` | varchar(300) | canal ou tipo de pagamento |
| `amount` | numeric(12,2) | sempre positivo |
| `type` | varchar(10) | `'income'` \| `'expense'` |
| `date` | date | ISO — inferida ou direta |
| `time` | varchar(10) | `"14h06"` — só para exibição |
| `payment_method` | varchar(100) | nullable |
| `date_inferred` | boolean | true quando data foi inferida |
| `skipped` | boolean | reservas automáticas e cancelados |
| `skip_reason` | varchar(100) | `"Reserva automática"` \| `"Cancelado"` |
| `status` | varchar(20) | `'pending'` \| `'confirmed'` \| `'discarded'` |
| `category_id` | uuid FK → categories | nullable — sugerido ou escolhido |
| `transaction_id` | uuid FK → transactions | nullable — preenchido após confirmação |
| `created_at` | timestamp | |

---

## Variáveis de Ambiente

```
# Gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash          # modelo — alterável sem tocar no código
GEMINI_VALIDATION_STRATEGY=tesseract   # 'gemini' ou 'tesseract' — default do servidor
GEMINI_PROJECT=projects/...            # projeto GCP

# Câmbio
USD_TO_BRL=6.10                        # fallback se open.er-api.com estiver indisponível
```

---

## O Que Ainda Precisa ser Definido

- [ ] Threshold de confiança para sugestão de categoria (Etapa 5)
- [ ] UX do loading durante extração — skeleton ou spinner com mensagem de progresso
- [ ] Política de retry em caso de falha do Gemini (tentativas, backoff)
- [ ] Mapeamento de colunas CSV por banco (Etapa 2)
- [ ] Tela de revisão editável (Etapa 6)
- [ ] Endpoint `POST /import/confirm` (Etapa 7)
- [ ] **[Pós-simulação]** Escolha do object storage para produção
