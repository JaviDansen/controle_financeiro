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

| Banco | Método | Status |
|---|---|---|
| Mercado Pago | OAuth + API direta | ✅ Validado |
| Outros bancos | Screenshot → LLM | 🔜 Padrão planejado |

> O Mercado Pago possui API própria que dispensa screenshot e LLM — fluxo validado manualmente em 2026-06-19. Demais bancos seguem o fluxo padrão de screenshot enquanto não tiverem API verificada.

---

## Mercado Pago — Fluxo OAuth (validado)

### Por que é diferente

O Mercado Pago disponibiliza OAuth 2.0 com Authorization Code Flow e endpoint de transações acessível via token. Isso elimina screenshot, LLM e revisão manual — as transações chegam estruturadas diretamente da API oficial.

**Teste realizado em 2026-06-19:**
- OAuth funcionou com conta pessoal (não exige conta business)
- `GET /v1/payments/search` retornou transações reais com todos os campos necessários
- Total de transações disponíveis na conta de teste: **3.881**
- Token expira em **6 meses** via refresh token

---

### Fluxo do Usuário — Mercado Pago

```
Usuário toca "Conectar Mercado Pago"
        ↓
App abre WebView com a tela de autorização do MP
("Autorize a conexão do aplicativo Finn-app...")
        ↓
Usuário faz login com a conta pessoal do MP e clica Autorizar
        ↓
MP redireciona com authorization code
        ↓
Backend troca o code por access_token + refresh_token
        ↓
Tokens salvos no banco vinculados ao userId do FinApp
        ↓
Backend busca transações via GET /v1/payments/search
        ↓
Normaliza para o contrato de transações do FinApp
        ↓
Usuário revisa, categoriza e confirma
        ↓
Transações salvas no FinApp
```

---

### Arquitetura OAuth

**App no Mercado Pago Developers:**
- Nome: Finn-app
- Client ID: `4753980642909698` (produção)
- Redirect URI: a definir (URL do backend em produção)
- Permissões necessárias: `read`, `offline_access`

**O usuário final não precisa criar nada** — ele apenas autoriza o Finn-app na tela do MP com a conta pessoal dele.

**Endpoints utilizados:**

| Endpoint | Uso |
|---|---|
| `GET https://auth.mercadopago.com.br/authorization` | Gera URL de autorização |
| `POST https://api.mercadopago.com/oauth/token` | Troca code por access_token |
| `GET /v1/payments/search?limit=N&offset=N` | Busca transações paginadas |

---

### Schema adicional necessário

Além das tabelas `import_images` e `import_sessions` já criadas, o fluxo OAuth do Mercado Pago exige uma tabela para armazenar os tokens por usuário:

**`mp_connections`** — a definir:

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | único por usuário, cascade delete |
| `mp_user_id` | varchar | ID do usuário no MP |
| `access_token` | text | token de acesso (criptografado) |
| `refresh_token` | text | token de renovação (criptografado) |
| `expires_at` | timestamp | data de expiração do access_token |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> Tokens devem ser armazenados **criptografados** no banco — nunca em texto puro.

---

### Prevenção de duplicatas — Mercado Pago

Como as transações vêm da API com IDs únicos do MP (`payment_id`), a deduplicação é mais confiável:

- Salvar o `payment_id` do MP junto à transação importada
- Antes de importar, verificar se o `payment_id` já existe para aquele `userId`
- Ignorar silenciosamente duplicatas na importação em lote

---

### O que Ainda Precisa ser Definido — Mercado Pago

- [ ] Definir redirect URI de produção (URL do backend Railway)
- [ ] Como abrir a WebView de autorização no React Native (expo-web-browser ou expo-auth-session)
- [ ] Criptografia dos tokens no banco (AES-256 ou similar)
- [ ] Estratégia de renovação automática do access_token via refresh_token
- [ ] Filtros de busca: período, tipos de pagamento a incluir/excluir
- [ ] Mapeamento de `description` do MP para categorias do FinApp (similaridade de texto)

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

## Schema do Banco

### `import_images`
Armazena cada imagem enviada. Consultada antes de chamar a LLM como portão anti-duplicata.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_hash` | varchar(64) | SHA-256 da imagem |
| `bank` | varchar(50) | ex: `'mercadopago'` |
| `format` | varchar(20) | `'screenshot'` \| `'csv'` \| `'pdf'` |
| `status` | varchar(20) | `'processed'` \| `'failed'` |
| `created_at` | timestamp | |

Índice único em `(user_id, image_hash)` — dois usuários podem ter a mesma imagem sem conflito.

### `import_sessions`
Registra cada importação concluída. Permite histórico e análise de qualidade da LLM.

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → users | cascade delete |
| `image_id` | uuid FK → import_images | cascade delete |
| `extracted_count` | integer | quantas transações a LLM extraiu |
| `confirmed_count` | integer | quantas o usuário confirmou |
| `created_at` | timestamp | |

---

## O que Ainda Precisa ser Definido

- [ ] Algoritmo de similaridade de texto para sugestão de categoria (ex: distância de Levenshtein, match por palavras-chave)
- [ ] Prompt da LLM para cada banco (o modelo do Mercado Pago precisa de um prompt específico)
- [ ] Como armazenar temporariamente a imagem no backend durante o processamento da LLM
- [ ] UX dos estados de loading durante a extração (pode demorar 3–10s)
