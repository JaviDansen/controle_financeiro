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
Retorna transactions[] ao mobile para cada arquivo enviado
        ↓
Mobile consolida e une todas as transações de todas as imagens em uma lista única unificada (removendo duplicados e skipping automáticos)
        ↓
Mobile exibe a lista consolidada com todas as transações encontradas nas imagens
        ↓
[PRÓXIMO] Usuário revisa: edita, exclui ou mantém cada item
        ↓
[PRÓXIMO] Usuário escolhe categoria (sistema sugere por similaridade ou usuário atrela manualmente)
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
- Mobile envia `fileBase64` + `referenceDate` + `sessionToken` + metadados via `POST /import/extract`
- Backend valida com Zod, calcula hash SHA-256, verifica duplicata
- Decodifica base64 e salva em `data_import/{images|documents}/{userId}/{imageId}.{ext}`
- Salva caminho relativo em `import_images.file_path`
- Chama Gemini Vision usando `referenceDate` como âncora de data
- Insere transações extraídas em `import_extracted_transactions`
- Persiste `sessionToken` e `ignoreKeywords` em `import_sessions`
- Retorna `transactions[]` ao mobile

> **Nota:** A etapa de pré-validação de cabeçalho de data (Tesseract/Gemini) foi removida do fluxo.
> A data de referência agora é fornecida diretamente pelo usuário via calendário, eliminando a necessidade de detecção automática.

### Etapa 2 — Exibição dos resultados ✅ Concluída

- Mobile consolida as transações extraídas de todos os arquivos enviados em uma lista única
- Filtro local por `ignoreKeywords` (campo editável na tela, padrão: `"reserva, guardar ao gastar"`)
- Badge "DATA?" para `date_inferred: true`
- Itens `skipped` não aparecem na lista principal; contador de ignorados exibido
- Modal de confirmação com lista resumida e saldo projetado (delta income − expense)
- Galeria de imagens enviadas com reextração via calendário no `GalleryItemModal`

### Etapa 3 — Confirmação e salvamento ✅ Concluída (backend) / 🔜 Pendente (UX de categoria)

**Backend implementado:**
- `POST /import/confirm` recebe `{ transactions: [{ id, categoryId, discard? }] }`
- Busca `import_extracted_transactions` filtrando por `userId` e `status = 'pending'`
- Para cada item confirmado: insere em `transactions`, atualiza `status = 'confirmed'` e `transaction_id`
- Para descartados: `status = 'discarded'`
- Atualiza `import_sessions.confirmed_count`
- Retorna `{ confirmed: N, discarded: M }`

**Pendente no mobile:**
- [ ] Dropdown de categoria inline por transação na lista de revisão
- [ ] Botão "Confirmar" enviando `categoryId` por item para `POST /import/confirm`

> Atualmente o modal de confirmação exibe o resumo mas ainda não envia `categoryId` —
> a confirmação final será ativada quando o fluxo de extração estiver estável.

### Etapa 4 — Tela de revisão editável 🔜 Pendente

- [ ] Editar título, valor, data por item antes de confirmar
- [ ] Mostrar itens `skipped` com visual diferente (riscado ou separado)
- [ ] Excluir item individual da lista antes de confirmar

### Etapa 5 — Sugestão automática de categoria 🔜 Pendente

- [ ] Após extração, comparar `title` de cada transação com os nomes das categorias do usuário
- [ ] Algoritmo: similaridade por palavras-chave ou Levenshtein (sem LLM)
- [ ] Preencher `categoryId` em `import_extracted_transactions` quando confiança > threshold
- [ ] Incluir `suggestedCategoryId` no retorno da API

---

## Mobile — Tela de Importação

Arquivo: `apps/mobile/app/(tabs)/import-extract.tsx`
Componente extraído: `apps/mobile/src/components/ui/CalendarPicker.tsx`

### Seções da tela

1. **Banco** — seleção do banco (atualmente só Mercado Pago)
2. **Data de referência** — `CalendarPicker` inline; obrigatório antes do envio
3. **Ignorar movimentações internas** — campo de texto editável com termos separados por vírgula; filtro aplicado localmente no resultado (padrão: `"reserva, guardar ao gastar"`)
4. **Arquivos** — botões "+ Imagens" e "+ Arquivo"; seleção múltipla; lista de status por arquivo após envio (pendente / duplicado / erro / sucesso com contagem)
5. **Transações encontradas** — lista consolidada de todos os arquivos; somente não-skipped; badge "DATA?" para `date_inferred: true`; contador de ignoradas pelo filtro
6. **Imagens disponíveis** — galeria em grid de imagens já enviadas; ao clicar abre `GalleryItemModal`

### GalleryItemModal (bottom-sheet)

Abre ao clicar em qualquer card da galeria:
- Preview da imagem com leitor de zoom (modal de fullscreen ao tocar)
- Banco selecionado (leitura apenas — herda o banco da tela principal)
- `CalendarPicker` para escolher `referenceDate`
- Botão **Extrair transações** → `POST /import/extract` com `imageId` + data escolhida

### Modal de confirmação

Abre ao clicar em "Confirmar transações" (visível após extração bem-sucedida de novos uploads):
- Lista resumida das transações a salvar (título, data, valor)
- Saldo projetado: delta de `income − expense` das transações extraídas
- Aviso de que categoria é obrigatória para salvar (seleção inline ainda pendente)
- Botão Cancelar

### Fluxo de estados da tela

```
Inicial (sem uploads) → selecionar arquivos → botão "Extrair transações" ativo
  ↓ mutação em progresso → loading por arquivo
  ↓ sucesso → lista de transações aparece + botão "Confirmar transações"
  ↓ confirmar → modal de resumo → [aguardando dropdown de categoria]
  ↓ "Analisar outras imagens" → resetAll → volta ao estado inicial
```

---

## Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/import/extract` | Recebe arquivo + referenceDate, salva, extrai e retorna transações |
| `GET` | `/import/gallery` | Lista as últimas imagens do usuário |
| `GET` | `/import/image/:imageId` | Serve a imagem autenticada para o mobile |
| `POST` | `/import/confirm` | Confirma transações revisadas pelo usuário |

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
  ignoreKeywords?: string[]           // ex: ["reserva", "guardar ao gastar"] — termos para marcar como skipped
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

### Segurança do Prompt — Defesas contra Prompt Injection

A IA processa imagens enviadas por usuários, o que cria risco de **prompt injection via imagem**: texto escrito no comprovante pode tentar dar instruções ao modelo.

As seguintes defesas estão implementadas no prompt:

| Defesa | Como funciona |
|---|---|
| **Identidade fixa** | O modelo é declarado como extrator de dados, sem capacidade de responder perguntas ou executar comandos |
| **Validação da imagem** | Se a imagem não contiver lista de transações com valores em R$ e datas, retorna `[]` imediatamente |
| **Blindagem a instruções na imagem** | Qualquer texto que pareça um comando é tratado como dado visual a transcrever ou ignorar, nunca como instrução |
| **Saída restrita a JSON** | O modelo é proibido de retornar qualquer texto fora do array JSON — sem markdown, explicações ou comentários |
| **Schema imutável** | Os campos da resposta são declarados como fixos — o modelo não pode adicionar, renomear ou remover campos |
| **Array sempre** | Mesmo com imagem inválida, a resposta deve ser `[]` — nunca um objeto ou texto livre |
| **Omissão de dados sensíveis** | CPF, número de cartão (mais de 4 dígitos seguidos), senhas e tokens são substituídos por `"[DADO OMITIDO]"` |

**O que NÃO está protegido (limitações do modelo):**
- Um modelo de linguagem visão não garante 100% de resistência a prompt injection sofisticado — é uma camada de defesa, não uma garantia absoluta
- A validação de que a imagem é um extrato é feita pelo próprio modelo (confiança no julgamento visual do Gemini)
- Dados sensíveis omitidos pelo modelo ainda passam pelo `readFile` e base64 no backend — o arquivo em si não é inspecionado antes de enviar ao Gemini

---

### Regras de inferência de data

1. **`referenceDate` fornecida pelo usuário** → âncora principal para o Gemini interpretar datas relativas
2. **Cabeçalho de data visível na imagem** → Gemini usa a data do cabeçalho diretamente, `date_inferred: false`
3. **Sem cabeçalho visível** → Gemini usa `referenceDate` como fallback, `date_inferred: true`

### Regras de Exclusão (Filtro de Cofrinhos / Reservas)

Para evitar que transferências internas (como "Cofrinhos" ou "Reservas" que apenas movem o saldo de lugar sem que o usuário de fato gaste o dinheiro) distorçam a conciliação:

1. **Entrada do Usuário**: O texto digitado pelo usuário (ex: `"reserva, guardar ao gastar"`) é dividido/categorizado a partir da vírgula em um array de termos minúsculos:
   ```ts
   ignoreKeywords: ["reserva", "guardar ao gastar"]
   ```
2. **Contexto no Prompt da IA**: O array de strings é inserido como um objeto JSON no prompt de contexto do Gemini:
   ```markdown
   [CONTEXTO DA TELA]
   A imagem mostra a tela "Atividade" do Mercado Pago (app Android/iOS).
   O ano de referencia e ${currentYear}.
   A data de referencia selecionada pelo usuario para esta imagem e ${todayIso}.
   Use essa data de referencia para interpretar cabecalhos relativos como "Hoje" e "Ontem".
   Termos adicionais que devem ser ignorados e desconsiderados (marcar com skipped: true): ${JSON.stringify(ignoreKeywords)}.
   ```
3. **Processamento do Gemini**: O modelo analisa o título e a descrição das transações encontradas na imagem. Se houver correspondência com qualquer um dos termos fornecidos, a transação deve ser retornada com `skipped: true` e a coluna `skip_reason` preenchida com `"Falso positivo (Filtro)"`.

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
| `session_token` | varchar(64) | UUID gerado no mobile — agrupa N imagens de um mesmo envio |
| `image_id` | uuid FK → import_images | nullable — cascade delete |
| `extracted_count` | integer | quantas transações foram extraídas |
| `confirmed_count` | integer | quantas o usuário confirmou |
| `ignore_keywords` | varchar(500) | termos de filtro (default: `"reserva, guardar ao gastar"`) |
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

- [ ] Dropdown de categoria inline por transação na tela de revisão
- [ ] Botão "Confirmar" enviando `categoryId` por item (ativar confirmação real)
- [ ] Threshold de confiança para sugestão automática de categoria (Etapa 5)
- [ ] UX do loading durante extração — skeleton ou spinner com mensagem de progresso
- [ ] Política de retry em caso de falha do Gemini (tentativas, backoff)
- [ ] Tela de revisão com edição de título/valor/data por item (Etapa 4)
- [ ] **[Pós-simulação]** Escolha do object storage para produção
