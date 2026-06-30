# Feature — Importação Automática de Transações

## Objetivo

Permitir que o usuário registre múltiplas transações de uma vez, sem precisar preencher cada uma manualmente. O sistema lê arquivos de extrato (screenshot ou PDF), extrai os dados e apresenta uma lista de revisão antes de salvar.

---

## Fluxo Completo

```
Usuário seleciona o banco
        ↓
Usuário seleciona a data de referência no calendário
        ↓
Usuário seleciona os arquivos de extrato (imagens ou documentos — múltipla seleção)
        ↓
Mobile envia cada arquivo (base64) + referenceDate para a API FinApp
        ↓
Backend calcula hash SHA-256 do arquivo
        ↓
Hash já existe no banco? → rejeita com 409, avisa o usuário
        ↓
Backend salva o arquivo em disco (pasta data_import/)       ← [SIMULADO — ver nota abaixo]
        ↓
Backend extrai as transações:
  - Screenshot → Gemini Vision (prompt por banco) usando referenceDate como âncora de data
  - PDF → Gemini Vision (modelo lê PDF nativamente)
        ↓
Backend salva transações extraídas em import_extracted_transactions
Backend salva tokens consumidos e custo em BRL em import_images
        ↓
Retorna transactions[] ao mobile
        ↓
Mobile exibe lista das transações extraídas (somente não-skipped) — apenas visualização
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
    └── documents/          ← PDFs
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
| Mercado Pago | Screenshot / PDF → Gemini Vision | ✅ Implementado |

---

## Plano de Implementação

### Etapa 1 — Recepção, salvamento e extração ✅ Concluída

- Usuário escolhe banco, data de referência e seleciona o(s) arquivo(s)
- Mobile envia `fileBase64` + `referenceDate` + metadados via `POST /import/extract`
- Backend valida com Zod, calcula hash SHA-256, verifica duplicata
- Decodifica base64 e salva em `data_import/{images|documents}/{userId}/{imageId}.{ext}`
- Salva caminho relativo em `import_images.file_path`
- Chama Gemini Vision usando `referenceDate` como âncora de data
- Insere transações extraídas em `import_extracted_transactions`
- Retorna `transactions[]` ao mobile

> **Nota:** A etapa de pré-validação de cabeçalho de data (Tesseract/Gemini) foi removida do fluxo.
> A data de referência agora é fornecida diretamente pelo usuário via calendário, eliminando a necessidade de detecção automática.

### Etapa 2 — Exibição dos resultados ✅ Concluída (parcial)

- Mobile exibe lista das transações extraídas (somente não-skipped)
- Badge "DATA?" para `date_inferred: true`
- Itens `skipped` não aparecem na lista principal
- **Apenas visualização** — edição e exclusão pendentes (Etapa 5)

### Etapa 3 — Sugestão de categoria 🔜 Pendente

- [ ] Após extração, comparar `title` de cada transação com os nomes das categorias do usuário
- [ ] Algoritmo: similaridade por palavras-chave ou Levenshtein (sem LLM)
- [ ] Preencher `categoryId` em `import_extracted_transactions` quando confiança > threshold
- [ ] Incluir `suggestedCategoryId` no retorno da API

### Etapa 4 — Tela de revisão editável (Mobile) 🔜 Pendente

- [ ] Cada item: editar título, valor, data; trocar/selecionar categoria
- [ ] Diferenciar visualmente itens com `date_inferred: true` (aviso de data incerta)
- [ ] Mostrar itens `skipped` com visual diferente (riscado ou separado)
- [ ] Excluir item da lista antes de confirmar
- [ ] Botão "Confirmar tudo" → `POST /import/confirm`
- [ ] Loading state durante extração (leva 3–10s)

### Etapa 5 — Confirmação e salvamento 🔜 Pendente

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
2. **Data de referência** — calendário para o usuário escolher a data antes de enviar o arquivo
3. **Arquivos** — seleção múltipla de imagens ou documentos; lista com status por arquivo após envio
4. **Transações extraídas** — lista das transações retornadas (somente não-skipped); badge "DATA?" para `date_inferred: true`
5. **Envios anteriores** — galeria de todas as imagens já enviadas; ao clicar abre modal com detalhes

### Modal de detalhes (bottom-sheet)

Abre ao clicar em qualquer card da galeria "Envios anteriores":
- Banco, data, status (processado / falhou / pendente)
- Contador de transações extraídas
- Preview das 3 primeiras transações (título, data, valor)
- Calendário para escolher `referenceDate` + botão **Reanalisar** → `POST /import/extract` com `imageId` + data escolhida

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/import/extract` | Recebe arquivo + referenceDate, salva, extrai e retorna transações |
| `GET` | `/import/gallery` | Lista as últimas imagens do usuário |
| `GET` | `/import/image/:imageId` | Serve a imagem autenticada para o mobile |
| `POST` | `/import/confirm` | *(a implementar)* Confirma transações revisadas pelo usuário |

> **Nota:** O endpoint `POST /import/validate` ainda existe no backend mas não é mais chamado pelo mobile.
> Pode ser removido em uma limpeza futura.

### Body de `/import/extract`

```ts
{
  bank: 'mercadopago'
  format: 'screenshot' | 'pdf'       // default: 'screenshot'
  fileBase64: string                  // base64 do arquivo (novo upload)
  fileName?: string
  mimeType?: string
  referenceDate: string               // ISO: "2026-06-30" — obrigatório para novos uploads
  // OU
  imageId: string                     // UUID de imagem já salva (reanalise da galeria)
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

1. **`referenceDate` fornecida pelo usuário** → âncora principal para o Gemini interpretar datas relativas
2. **Cabeçalho de data visível na imagem** → Gemini usa a data do cabeçalho diretamente, `date_inferred: false`
3. **Sem cabeçalho visível** → Gemini usa `referenceDate` como fallback, `date_inferred: true`

---

## Schema do Banco

### `import_images`

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_hash` | varchar(64) | SHA-256 do arquivo — único por usuário |
| `bank` | varchar(50) | `'mercadopago'` |
| `format` | varchar(20) | `'screenshot'` \| `'pdf'` |
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
GEMINI_PROJECT=projects/...            # projeto GCP

# Câmbio
USD_TO_BRL=6.10                        # fallback se open.er-api.com estiver indisponível
```

> **Nota:** `GEMINI_VALIDATION_STRATEGY` foi removida — a detecção automática de cabeçalho não é mais usada.

---

## O Que Ainda Precisa ser Definido

- [ ] Threshold de confiança para sugestão de categoria (Etapa 3)
- [ ] UX do loading durante extração — skeleton ou spinner com mensagem de progresso
- [ ] Política de retry em caso de falha do Gemini (tentativas, backoff)
- [ ] Tela de revisão editável (Etapa 4)
- [ ] Endpoint `POST /import/confirm` (Etapa 5)
- [ ] **[Pós-simulação]** Escolha do object storage para produção
