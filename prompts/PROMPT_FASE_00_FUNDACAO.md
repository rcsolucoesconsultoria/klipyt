# PROMPT FASE 0 — Fundação e Infraestrutura

> **Pré-requisito:** Repositório clonado, Node 20+, Docker Desktop.  
> **Próxima fase:** `PROMPT_FASE_01_ALBUM.md`  
> **Referências obrigatórias:** `@DATABASE_BLUEPRINT.md` `@INFRASTRUCTURE.md` `@IMPLEMENTATION_PROMPT.md`

---

## Objetivo

Entregar a base técnica reproduzível do KLIPYT: monorepo, PostgreSQL+PostGIS, Redis, migrations completas, seeds, esqueleto Clean Architecture no NestJS, health check e domínio geoespacial mínimo.

**Não implementar:** OAuth, mapa, álbum, campanhas, Pix.

---

## Escopo exato

### INCLUIR

1. `docker-compose.yml` idêntico a `INFRASTRUCTURE.md` (`postgres_db` postgis, `redis_cache`).
2. Monorepo:
   - `apps/api` — NestJS + TypeORM + PostGIS
   - `apps/pwa` — React + Vite (shell vazio com rota `/health` proxy opcional)
   - `package.json` raiz com workspaces (opcional)
3. Migration `InitialSchema` com **todo** DDL de `DATABASE_BLUEPRINT.md`:
   - Extensões `uuid-ossp`, `postgis`
   - ENUMs, tabelas `platform_settings` … `wallet_transactions`
   - Índices GIST em `establishments`, `financial_coins`, `sticker_packs`
4. Seeds:
   - `global_margin` = `0.40`
   - `fase_monetizacao_ativa` = `false`
   - `tema_ativo` = `"COPA"`
5. Entidades TypeORM espelhando cada tabela (sem lógica de negócio pesada).
6. `GeoValidatorService` em `domain/services/`:
   - Método `isWithinRadius(userLat, userLon, targetLat, targetLon, maxMeters = 25): boolean`
   - Usar fórmula Haversine ou equivalente em domínio puro (testes unitários).
7. `GET /api/v1/health` → `{ status: 'ok', db: 'up', redis: 'up' }`
8. `.env.example` conforme `IMPLEMENTATION_PROMPT.md` seção 10.
9. Scripts npm:
   - `migration:run`, `migration:revert`, `db:seed`
   - `dev`, `build`, `test`
10. `HttpExceptionFilter` global + `ValidationPipe` global.
11. Testes: `geo-validator.spec.ts` (distância 12m OK, 300m FAIL).

### EXCLUIR

- Controllers de negócio (auth, album, campaign…)
- Use cases além de health
- PWA com mapa funcional

---

## Estrutura de pastas (`apps/api/src/`)

```
domain/
  entities/          # 11 entidades
  enums/             # user_status, rarity, campaign_status, reward_status, tx_status, asset_type
  value-objects/     # GeoPoint, Cpf, Cnpj, Money, PinCode (esqueletos)
  services/          # geo-validator.service.ts
infrastructure/
  database/
    migrations/
    seeds/
    database.module.ts
    data-source.ts
  redis/
    redis.module.ts
    redis.service.ts   # getClient(), ping()
  http/
    controllers/health.controller.ts
    filters/http-exception.filter.ts
use-cases/
  tokens.ts          # vazio ou só comentário — expandir na Fase 1
app.module.ts
main.ts              # prefix api/v1, CORS, pipes
```

---

## Critérios de aceite (todos obrigatórios)

- [ ] `docker compose up -d` sobe PostGIS e Redis sem erro
- [ ] `npm run migration:run` cria todas as tabelas
- [ ] `npm run db:seed` popula `platform_settings`
- [ ] `curl http://localhost:3000/api/v1/health` retorna 200 com db e redis up
- [ ] `npm run test` passa nos testes do GeoValidator
- [ ] Nenhum import de `infrastructure` dentro de `domain/`

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_00_FUNDACAO.md usando @DATABASE_BLUEPRINT.md e @INFRASTRUCTURE.md.
Não avance para a Fase 1.
```
