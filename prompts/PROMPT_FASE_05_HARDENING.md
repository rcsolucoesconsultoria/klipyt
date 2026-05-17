# PROMPT FASE 5 — Hardening, segurança e observabilidade

> **Pré-requisito:** Fases 0–4 funcionais end-to-end.  
> **Próxima fase:** `PROMPT_FASE_06_ADMIN.md`  
> **Referências:** `@BRD.md` (RN01 antifraude) `@INFRASTRUCTURE.md`

---

## Objetivo

Endurecer o sistema para produção: rate limiting global, auditoria, secrets, CORS restrito, health detalhado, métricas, testes de carga básicos e políticas antifraude ampliadas.

---

## Escopo

### 1. Segurança API

- `@nestjs/throttler` — 100 req/min IP, 20 req/min rotas sensíveis (`collect`, `withdraw`, `open-pack`)
- Helmet + CSP headers na API
- CORS: apenas origens `PWA_URL`, `PORTAL_URL` do `.env`
- JWT: refresh token rotation (opcional) ou access 15m + refresh 7d
- Sanitizar logs (nunca logar CPF/CNPJ plain)

### 2. Antifraude ampliado (RN01)

- Velocidade impossível: duas coletas > 500m em < 60s → flag `users.risk_score`
- Lista block `device_fingerprint` em Redis SET
- Admin endpoint interno `POST /internal/users/:id/block` (API key env) — preparação Fase 6
- Coleta exige `navigator.geolocation` accuracy < 100m no PWA (reject client-side + server)

### 3. Observabilidade

- `pino` ou Winston JSON logs
- `GET /api/v1/health` estendido: postgres latency, redis memory, migration version
- OpenTelemetry stub (opcional): trace id em headers `x-request-id`
- `docker-compose` serviço `prometheus` + `grafana` — dashboards: req/s, 4xx/5xx, coletas/min

### 4. CI/CD

- `.github/workflows/ci.yml`:
  - `npm ci`, `lint`, `test`, `build`
  - Services: postgres postgis, redis
- `.github/workflows/docker.yml` (opcional): build API image

### 5. Testes

- Suite E2E Playwright PWA: login mock → mapa → open pack (ambiente test)
- k6 ou artillery script: 50 VUs em `/coins/nearby` 30s — documentar SLA p95 < 500ms local
- Cobertura mínima 70% em `domain/` e `use-cases/` (jest coverage threshold)

### 6. Documentação operacional

- `docs/RUNBOOK.md`: backup Postgres, rotate secrets, rollback migration
- Atualizar `INFRASTRUCTURE.md` com variáveis produção

---

## PWA

- Service Worker cache estratégico (map tiles, assets) — Workbox
- Offline banner quando API unreachable
- Remover `console.log` de produção (vite define)

---

## Critérios de aceite

- [ ] Throttle retorna 429 em burst attack simulado
- [ ] Webhook Pix rejeita replay (> 5 min timestamp)
- [ ] CI verde no GitHub Actions
- [ ] Coverage ≥ 70% domain+use-cases
- [ ] RUNBOOK revisável por ops
- [ ] Nenhum secret commitado (gitleaks ou manual review)

---

## NÃO implementar

- CMS temas completo (Fase 6)
- Novos UCs de negócio

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_05_HARDENING.md.
Não avance para Fase 6.
```
