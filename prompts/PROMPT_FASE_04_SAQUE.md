# PROMPT FASE 4 — Saque Pix (cash-out usuário)

> **Pré-requisito:** Fase 3 (wallet usuário com saldo real).  
> **Próxima fase:** `PROMPT_FASE_05_HARDENING.md`  
> **Referências:** `@USE_CASES.md` (UC11) `@BRD.md` (RF15–16)

---

## Objetivo

Usuário `ACTIVE` solicita saque do `wallet_balance` para chave Pix **tipo CPF** (mesmo CPF validado no upgrade — BRD RF). Integração **C6 Bank BaaS** (`pix-collection.json`) + mock em dev. Webhook confirma ou estorna.

---

## UC11 — fluxo

```gherkin
Dado usuário ACTIVE com wallet_balance >= valor_minimo
Quando solicita saque informando chave Pix e valor
Então sistema debita saldo (hold), cria wallet_transaction PENDING
E ao webhook CONFIRMED status COMPLETED
E ao webhook FAILED credita saldo de volta
```

---

## Backend

### Migration (se necessário)

```sql
ALTER TABLE wallet_transactions
  ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pix_key_value VARCHAR(255),
  ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(64) UNIQUE;
```

### Adapter pattern

```
infrastructure/payment/
  payment-gateway.port.ts
  mock-payment.gateway.ts
  c6/c6-pix.gateway.ts           # C6 BaaS — ver pix-collection.json
  c6/c6-pix.constants.ts
```

### Use cases

| Arquivo | Responsabilidade |
|---------|------------------|
| `wallet/request-withdrawal.use-case.ts` | Valida mínimo **R$ 6,00**, saldo, CPF ativo, `fraud_flag=false`, chave Pix CPF, cria tx PENDING, chama gateway |
| `wallet/process-pix-webhook.use-case.ts` | Idempotente por `external_id`; atualiza status; ajusta `wallet_balance` |

### Controllers

| Rota | Método | Auth |
|------|--------|------|
| `/wallet/withdraw` | POST | JWT user |
| `/webhooks/pix` | POST | HMAC signature (secret env) |

### Regras

- Valor mínimo saque: **R$ 6,00** (BRD, UC11)
- Chave Pix: somente **CPF** igual ao cadastro validado
- `fraud_flag = true` → **403** (bloqueio preventivo)
- Máximo 3 saques/dia/CPF (Redis counter)
- `idempotency_key` header obrigatório no withdraw
- Débito otimista: `wallet_balance -= amount` no request; rollback no FAILED

### `.env` (C6)

```
PIX_GATEWAY=c6
C6_API_BASE_URL=https://baas-api-sandbox.c6bank.info
C6_ACCESS_TOKEN=
C6_PIX_KEY=
PIX_WEBHOOK_URL=http://localhost:3000/api/v1/webhooks/pix
PIX_WEBHOOK_SECRET=
API_PUBLIC_URL=http://localhost:3000
```

Cadastrar webhook no C6: `PUT /v2/pix/webhook/{C6_PIX_KEY}` com body `{ "webhookUrl": "<PIX_WEBHOOK_URL>" }`.

---

## PWA

- `WalletPage`: formulário saque, histórico `GET /wallet/transactions`
- Estados UI: PENDING (spinner), COMPLETED (sucesso), FAILED (retry)

---

## Portal PJ (opcional nesta fase)

- Recarga `merchant_wallets` via mesmo gateway (invoice Pix) — stub OK

---

## Testes

- Withdraw saldo insuficiente → 400
- Webhook duplicado → 200 idempotente sem double debit
- FAILED restaura saldo
- INCOMPLETE user → 403

---

## Critérios de aceite

- [ ] Saque mock completa em < 5s em dev
- [ ] Webhook HMAC rejeita payload inválido → 401
- [ ] Histórico transações visível no PWA
- [ ] Logs estruturados com `transaction_id`
- [ ] Nenhum saldo negativo em concorrência (teste integração)

---

## NÃO implementar

- Antifraude ML (Fase 5)
- Admin temas (Fase 6)

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_04_SAQUE.md (UC11).
Não avance para Fase 5.
```
