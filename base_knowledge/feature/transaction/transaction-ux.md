# UX — Formulário de Nova Transação

## Visão Geral

O formulário é dividido em **3 passos** para não sobrecarregar o usuário de uma vez.
Cada passo tem um objetivo único e claro.

Protótipos interativos:
- [Passo 1 — Tipo e Valor](./transaction-form-step1.html)
- [Passo 2 — Categoria e Cartão](./transaction-form-step2.html)
- [Passo 3 — Revisão e Confirmação](./transaction-form-step3.html)

---

## Passo 1 — Tipo e Valor

**Objetivo:** capturar o essencial — quanto foi e o que foi.

| Campo | O que o usuário faz | Obrigatório | Observação |
|---|---|---|---|
| **Tipo** | Toca em "Receita" ou "Despesa" | Sim | Padrão: Despesa |
| **Valor** | Digita apenas números — formatado automaticamente como `R$ 312,47` | Sim | Teclado numérico |
| **Descrição** | Escreve o nome da transação | Sim | Ex: "Mercado", "Salário" |
| **Data** | Escolhe no seletor de data nativo | Sim | Padrão: hoje |

**O que NÃO aparece neste passo:** categoria, cartão, notas, status.
O usuário não precisa pensar em classificação antes de registrar o valor.

---

## Passo 2 — Categoria e Cartão

**Objetivo:** classificar e vincular a transação.

| Campo | O que o usuário faz | Obrigatório | Observação |
|---|---|---|---|
| **Categoria** | Toca em um dos 9 blocos do grid | Sim | Grade visual com letra + cor |
| **Cartão** | Desliza e toca no cartão desejado | Não | "Sem cartão" é o padrão |
| **Notas** | Texto livre opcional | Não | Ex: "Parcelado 3x", "Mensal" |
| **Recorrente** | Toggle on/off | Não | Padrão: desligado |

**Categorias disponíveis (vindas do banco):**

| Nome | Cor | Letra |
|---|---|---|
| Alimentação | `#C07830` | A |
| Transporte | `#3B5DA0` | T |
| Saúde | `#B04040` | S |
| Moradia | `#3D8B4E` | M |
| Assinaturas | `#6B4EA0` | A |
| Lazer | `#9A8030` | L |
| Receita | `#3D8B4E` | + |
| Freelance | `#2E7A8A` | F |
| Compras | `#A03070` | C |

**Cartões listados:** vêm da API (`GET /cards`) — os cartões reais do usuário, com nome e últimos 4 dígitos.

---

## Passo 3 — Revisão e Confirmação

**Objetivo:** o usuário vê tudo antes de salvar — sem surpresas.

| Campo | O que o usuário vê | Editável aqui |
|---|---|---|
| Tipo | Badge colorido (verde receita / laranja despesa) | Não |
| Valor | Número grande em destaque | Não |
| Descrição | Título da transação | Não |
| Data | Data formatada por extenso | Não |
| Categoria | Nome + ponto colorido | Não |
| Cartão | Nome + últimos 4 dígitos | Não |
| Notas | Texto ou "—" se vazio | Não |
| Recorrente | "Sim" ou "Não" | Não |
| **Status** | Seletor de 3 opções | **Sim** |

### Por que o Status fica no passo 3?

O status é a única informação que depende de uma decisão consciente no momento de salvar.
Colocá-lo no início confundiria o usuário que ainda está preenchendo os dados básicos.

**Opções de status:**

| Status | Quando usar |
|---|---|
| `confirmed` ✓ | Transação já aconteceu (padrão) |
| `pending` ⏳ | Agendada ou aguardando compensação |
| `cancelled` ✕ | Foi cancelada mas o usuário quer manter o registro |

---

## O que vai para a API

Ao confirmar no passo 3, o app monta e envia:

```json
POST /transactions
{
  "title": "Mercado Pão de Açúcar",
  "amount": 312.47,
  "type": "expense",
  "categoryId": "uuid-da-categoria",
  "cardId": "uuid-do-cartao-ou-null",
  "date": "2026-06-12",
  "notes": "",
  "isRecurring": false,
  "status": "confirmed"
}
```

O `userId` **não é enviado** — vem do JWT no header `Authorization`.

---

## Estados de UI importantes

| Situação | Comportamento |
|---|---|
| Usuário não preencheu valor | Botão "Próximo" bloqueia com alerta |
| Usuário não escolheu categoria | Botão "Próximo" bloqueia com alerta |
| API retorna erro ao salvar | Mensagem de erro inline, sem fechar o passo 3 |
| Salvo com sucesso | Toast verde "Transação salva" + volta para a lista |
| Sem cartões cadastrados | Seção de cartão oculta ou mostra "Adicionar cartão" |
