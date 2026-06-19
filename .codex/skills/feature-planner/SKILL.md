# SKILL — Feature Planner (mvp-launchpad)

## Quando usar esta skill

Carregue este arquivo sempre que a tarefa envolver **planejar ou documentar uma nova feature** antes de implementá-la. Isso inclui qualquer mudança que afete banco de dados, mais de um módulo, ou qualquer fluxo financeiro/billing.

Não é necessário para correções de bug isoladas, ajustes de texto ou mudanças de configuração simples.

---

## Protocolo obrigatório antes de qualquer implementação

### Passo 1 — Diagnóstico do estado atual

Antes de propor qualquer coisa, ler os arquivos relevantes com Grep/Read. Nunca planejar de memória.

Perguntas obrigatórias:
1. Qual tabela/entidade mais próxima já existe que se relaciona com esta feature?
2. Existe algum campo ou fluxo que já faz parcialmente o que a feature precisa?
3. A feature toca billing? Se sim, mapear quais passos da cadeia de sincronia serão afetados.
4. A feature toca dados de empresa? Se sim, verificar como o `companyId` será resolvido.

### Passo 2 — Criar o documento de planejamento

Salvar em:
```
base_knowledge/features/<nome-da-feature>.md
```

Seguir o template da seção abaixo.

### Passo 3 — Aguardar confirmação antes de implementar

Esperar aprovação do humano sobre o plano antes de tocar em qualquer arquivo de produção — a menos que o humano peça implementação direta junto com o planejamento.

---

## Template de documento de feature

```markdown
# [Nome da Feature]

**Status:** Planejado | Em implementação | Concluído
**Prioridade:** Alta | Média | Baixa
**Contexto originador:** [problema real que motivou a feature]

---

## Sistema Atual (como funciona hoje)

[Descrever o estado atual nos pontos que a feature vai tocar.
Incluir nomes de arquivos, métodos e campos relevantes.
Sempre verificar no código — nunca escrever de memória.]

---

## Problema

[Uma ou duas frases sobre o que falta ou falha hoje.]

---

## Solução Proposta

[Abordagem escolhida. Se houver alternativas descartadas, registrar por quê.]

---

## Banco de dados

[SQL de migration. Incluir índices, constraints e checks.]

---

## Backend

[Novos serviços, métodos e rotas. Indicar arquivo de destino para cada peça.]

---

## Fluxo completo (ponta a ponta)

[Caminho que uma ação percorre do clique/evento até o banco e de volta para a tela.
Se tocar billing, detalhar quais métodos da cadeia de sincronia são chamados e em que ordem.]

---

## Frontend

[Onde o usuário vê/interage com a feature. Aba, componente ou página afetada.]

---

## Decisões de Design Registradas

| Decisão | Escolha | Motivo |
|---|---|---|

---

## Checklist de implementação

[ ] Migration criada e testada
[ ] Entidade TypeORM criada/atualizada
[ ] Serviço com lógica de negócio
[ ] Rota e controller
[ ] Frontend
[ ] Testes dos casos principais
[ ] Race condition verificado (se aplicável)
[ ] Property-based test (se houver cálculo financeiro)
[ ] Log estruturado nos pontos críticos
```

---

## Padrões arquiteturais do projeto — extraídos do código

Esta seção contém as regras derivadas da leitura real do codebase. Todo plano de feature deve respeitá-las.

---

### 1. Isolamento por empresa — como funciona de verdade

**Arquivo:** `backend/src/modules/companies/company-context.ts`
**Arquivo:** `backend/src/shared/company-guard.ts`

O `companyId` de toda operação administrativa vem do JWT do usuário autenticado, nunca do body da requisição.

```typescript
// Padrão obrigatório no controller:
const context = await requireAdminCompanyContext(response.locals.auth);
if (!context?.companyId) {
  return response.status(403).json({ message: "Empresa nao vinculada ao administrador" });
}
// A partir daqui, usar context.companyId em todas as queries
```

No serviço, usar `assertCompanyId()` no início de qualquer método que toque dados de empresa:

```typescript
// backend/src/shared/company-guard.ts
assertCompanyId(companyId, "NomeDoServico.nomeDoMetodo");
// Lança erro se companyId for null, undefined ou 0
```

**Regra:** qualquer nova rota admin que acesse dados de participante, serviço, pagamento ou comprovante deve começar com `requireAdminCompanyContext` e propagar o `companyId` resultante para o serviço. Nunca aceitar `companyId` do frontend.

---

### 2. `isActiveForFlows` — o que significa e de onde vem

**Arquivo:** `backend/src/modules/participants/participant-activation.ts`

Um participante é "ativo para fluxos" quando satisfaz **todas** as condições abaixo, avaliadas em SQL:

```
role = 'USER'
AND name não vazio
AND email não vazio
AND phone não vazio
AND cpfSuffix não vazio
AND (
  paymentInstitution não vazio
  OR existe user_payment_profiles.active = true com bank não vazio
)
AND existe ao menos uma entrada em service_members
```

`isActiveForFlows = false` significa que o participante:
- Não entra em cobranças (payments não são gerados)
- Não aparece em matching de comprovantes
- Não pode ser sincronizado manualmente na Central
- Não recebe lembretes

**Regra para features de billing:** sempre filtrar por `isActiveForFlows = true` antes de processar. Usar `buildActiveParticipantSql("u")` ou `buildActiveParticipantSelectSql("u")` nas queries, nunca reescrever a lógica na mão.

---

### 3. A cadeia de sincronia de billing — ordem obrigatória

**Arquivo:** `backend/src/modules/participants/participants.service.ts`
**Arquivo:** `backend/src/modules/services/service-billing.ts`

Toda vez que qualquer dado que afete o valor de cobrança muda (serviço, membro, agregado), a cadeia abaixo deve ser executada **nesta ordem**:

```
1. syncServiceMembers(serviceIdFilter?)
   → Atualiza campos denormalizados em service_members:
     serviceName, serviceValue, membersCount, valuePerUser

2. syncUsersMonthlyValue(userIds?, companyId?)
   → Recalcula users.monthlyValue para os participantes afetados
   → Fórmula: SUM(totalValue / (membersCount + 1)) por serviço

3. syncOpenCurrentMonthPaymentsForUsers(userIds)
   → Atualiza/cria registros em payments para o mês atual
   → Ignora ADMIN, ignora participantes com isActiveForFlows = false
   → AGREGADO: apaga payments próprios (billing vai para o TITULAR)
```

Esta cadeia é chamada em `create`, `update` e `deletePaymentInstitutions` de `ParticipantsService`, e em `update` e `remove` de `ServicesService`.

**Regra:** qualquer feature que altere membros de serviço, valor de serviço ou vínculo de agregado deve chamar essa cadeia completa. Alterar só um passo deixa dados inconsistentes.

---

### 4. A fórmula de billing — de onde vem o +1

**Arquivo:** `backend/src/modules/services/service-billing.ts`

```typescript
export const ADMIN_IMPLICIT_PARTICIPANTS = 1;

// Valor por participante:
totalValue / (membersCount + 1)
```

O `+1` representa o admin, que sempre conta como um membro implícito mesmo sem aparecer em `service_members`. Isso significa que em um serviço com 3 participantes e `totalValue = R$40`, cada um paga `40 / 4 = R$10`.

**Regra:** nunca dividir por `membersCount` direto. Sempre usar `buildBillingDivisorSql(membersCountExpr)` em SQL ou `calculateBillingShare(totalValue, membersCount)` em TypeScript.

---

### 5. `service_members` é denormalizado — nunca confiar como fonte live

**Arquivo:** `backend/src/modules/services/service-member.entity.ts`

A tabela `service_members` tem campos cacheados: `userName`, `serviceName`, `serviceValue`, `membersCount`, `valuePerUser`. Eles são atualizados por `syncServiceMembers()` e podem estar desatualizados se uma mutation não chamou a sincronia.

**Regra:** para leituras em features novas que precisam de valores de billing ao vivo, calcular na hora via join com `services` e `COUNT(*)`, como a query em `syncOpenCurrentMonthPaymentsForUser` faz. Não confiar nos campos cacheados de `service_members` para decisões financeiras.

---

### 6. `payments` vs `payment_alerts` — papéis distintos

**`payments`** (`backend/src/modules/payments/payment.entity.ts`)
- Um registro por participante × serviço × mês
- Status: `PENDING | PAID | OVERDUE`
- `calculatedValue`: o que o participante deve pagar naquele serviço naquele mês
- `sourceUserId`: usuário original (pode ser diferente de `userId` em casos de AGREGADO)
- É a grade de cobrança. Gerado no reset mensal e atualizado pela sincronia.

**`payment_alerts`** (`backend/src/modules/payments/payment-alert.entity.ts`)
- Um registro por participante × mês quando `paidAmount > expectedAmount`
- Status: `OPEN | RESOLVED`
- `overpaidAmount`: a diferença positiva (o excedente)
- É o sistema de anomalias. Não afeta pagamentos diretamente.

**Regra:** features que precisam saber "o participante pagou?" consultam `payments`. Features que precisam saber "o participante pagou a mais?" consultam `payment_alerts`. Nunca misturar os papéis.

---

### 7. Tipos de participante — NORMAL, TITULAR, AGREGADO

**Arquivo:** `backend/src/modules/participants/participant-aggregates.ts`

```
NORMAL   → participante sem vínculo de agregação
TITULAR  → tem agregados vinculados a ele (tabela participant_aggregates)
AGREGADO → está vinculado a um TITULAR
```

Regras de billing para AGREGADO:
- Seus pagamentos são deletados de `payments` — o billing vai para o TITULAR
- `resolveBillingUserId(userId, relations)` retorna o `ownerUserId` se o usuário for AGREGADO, ou o próprio `userId` caso contrário
- Em todas as queries de billing, usar `billingUserId` (resultado de `resolveBillingUserId`), não `userId` diretamente

**Regra:** toda feature de billing deve resolver o `billingUserId` antes de criar, buscar ou atualizar `payments`. Ignorar isso gera cobranças duplicadas.

---

### 8. Webhooks — padrão fire-and-forget

**Arquivo:** `backend/src/modules/webhooks/n8n.service.ts`

Toda chamada a webhook externo (N8N, WhatsApp) é fire-and-forget:

```typescript
// Correto — falha no webhook não quebra o fluxo principal
void n8nWebhookService.sendReminder(payload);

// Errado — await que pode bloquear ou lançar para o caller
await n8nWebhookService.sendReminder(payload);
```

O `N8nWebhookService.postWebhook()` já trata timeout, captura erros e loga internamente. O caller nunca precisa tratar o resultado.

**Regra:** qualquer nova chamada a N8N ou sistemas externos deve ser `void`. Adicionar novos tipos de payload em `n8n.service.ts` seguindo o padrão existente (`sendReminder`, `sendPasswordResetRequest`). Adicionar a URL correspondente como variável de ambiente e registrá-la no `.env.example` e no `CLAUDE.md`.

---

### 9. `users.monthlyValue` é denormalizado — não é live

O campo `users.monthlyValue` é o total mensal consolidado do participante. Ele é atualizado por `syncUsersMonthlyValue()` e pode estar desatualizado entre mutations.

**Regra:** não usar `users.monthlyValue` como valor live em decisões de cobrança ou crédito sem garantir que a sincronia foi executada antes. Para o valor ao vivo, recalcular via join com `services` e `service_members`.

---

### 10. Nunca adicionar estado temporário em `users`

A tabela `users` é o núcleo de identidade. O projeto tem um padrão claro: estado específico de domínio vai em tabelas próprias com histórico.

Exemplos do padrão já estabelecido:
- Perfis de pagamento → `user_payment_profiles`
- Alertas de excedente → `payment_alerts`
- Sessões de onboarding → `onboarding_sessions`
- Resets de senha → tabela própria de reset

**Regra:** se a feature precisa guardar algo novo por participante (crédito, flag de campanha, histórico de ação), criar uma tabela dedicada com `userId`, `companyId`, timestamps e auditoria. Nunca adicionar colunas de estado temporário diretamente em `users`.

---

## Exemplo de planejamento bem-feito neste projeto

`base_knowledge/features/credit-and-notifications-plan.md`

Esse documento mostra o nível esperado: diagnóstico do código atual com nomes de arquivos reais, schema de banco completo com SQL, fluxo ponta a ponta especificando quais métodos são chamados e em que ordem, decisões de design justificadas e checklist de implementação.
