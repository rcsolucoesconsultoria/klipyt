# PROMPT FASE 6 — Admin, temas e go-live

> **Pré-requisito:** Fases 0–5 completas.  
> **Esta é a última fase** — após executá-la, o Pix GO deve estar **completo** para go-live controlado.  
> **Referências:** `@BRD.md` (RF17–18, CMS) `@IMPLEMENTATION_PROMPT.md` checklist final

---

## Objetivo

Painel administrativo global: toggles de plataforma (`fase_monetizacao_ativa`, `tema_ativo`, `global_margin`), moderação de estabelecimentos, temas visuais (Copa, Carnaval, etc.) e checklist de go-live.

---

## Pacote: `packages/admin` (ou rotas em portal com role `SUPER_ADMIN`)

### Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Settings** | Editar `platform_settings` com auditoria |
| **Establishments** | Listar, aprovar, suspender PJ |
| **Users** | Buscar por email, bloquear, ver `risk_score` |
| **Themes** | CRUD `themes` table (criar migration) — JSON cores/logo |
| **Coins/Packs** | Override emergencial desativar geo Redis |
| **Audit log** | `admin_audit_logs` — quem alterou o quê |

### Migration sugerida

```sql
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100),
  config JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES users(id),
  action VARCHAR(100),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Backend

### Use cases

| Arquivo | Responsabilidade |
|---------|------------------|
| `admin/update-platform-settings.use-case.ts` | Valida ranges (margin 0–0.9), invalida cache Redis |
| `admin/list-establishments.use-case.ts` | Paginação, filtros |
| `admin/moderate-establishment.use-case.ts` | status SUSPENDED → remove GEO coins/packs |
| `admin/activate-theme.use-case.ts` | Uma theme ativa; PWA lê via `/settings/public` |

### Auth

- `users.role = SUPER_ADMIN` (coluna migration) ou tabela `admin_users`
- `AdminAuthGuard` + MFA stub (TOTP opcional)

### Controllers `/api/v1/admin/*`

Todas rotas exigem `SUPER_ADMIN`.

| Rota | Método |
|------|--------|
| `/settings` | GET, PATCH |
| `/establishments` | GET |
| `/establishments/:id/suspend` | POST |
| `/themes` | GET, POST |
| `/themes/:slug/activate` | POST |
| `/audit-logs` | GET |

---

## PWA consumidor — temas

- `useSettings()` retorna `tema_ativo`
- Carregar CSS variables / assets de `/themes/:slug/config.json` público
- Transição suave ao trocar tema (sem reload total)

---

## WebAR (RF17 — opcional mínimo)

- Integrar **8th Wall** ou **model-viewer** em página `/ar/:sticker_id`
- Link no álbum para figurinhas `LEGENDARY` com `ar_model_url` (coluna opcional em `stickers`)
- Se sem licença 8th Wall: documentar placeholder + model-viewer glTF estático

---

## Checklist go-live (implementar como `docs/GO_LIVE_CHECKLIST.md`)

- [ ] `fase_monetizacao_ativa` false em staging, true só após aprovação
- [ ] PSP produção configurado (Fase 4)
- [ ] Backup automático Postgres
- [ ] SSL/TLS terminado (Nginx/Coolify)
- [ ] LGPD: política privacidade link no PWA
- [ ] Limites saque e coleta revisados
- [ ] Seeds desabilitados em produção
- [ ] Monitoramento Grafana (Fase 5)

---

## Testes finais (obrigatórios)

### Jornada completa E2E (documentar em `docs/E2E_JOURNEY.md`)

1. Usuário Google → álbum → abre pacote
2. Upgrade CPF → coleta moeda com vídeo
3. Saque Pix mock
4. PJ cria campanha → pacote aparece no mapa
5. Admin altera margem → nova coleta usa valor atualizado
6. Admin suspende PJ → moedas/pacotes somem do geo

### Regressão

- `npm run test` monorepo inteiro verde
- `docker compose up` sobe API + PWA + Portal + Admin

---

## Critérios de aceite finais (produto completo)

- [ ] Todas as fases 0–6 representadas em código
- [ ] 12 UCs de `USE_CASES.md` cobertos (UC01–UC12)
- [ ] PWA + API + Portal PJ + Admin operacionais
- [ ] `gerar_docs.py` gera docs + lista `prompts/` no README
- [ ] Matriz RF→UC em `README.md` bate com implementação
- [ ] Nenhum TODO crítico em rotas de produção

---

## Comando Cursor

```
Implemente integralmente @prompts/PROMPT_FASE_06_ADMIN.md.
Esta é a fase final: complete WebAR mínimo, admin, temas e checklist go-live.
Valide jornada E2E descrita em docs/E2E_JOURNEY.md.
```

---

## Pós-implementação

Executar em ordem de validação:

```bash
docker compose up -d
npm run migration:run
npm run db:seed
npm run dev
```

Abrir PWA, Portal PJ e Admin; percorrer `docs/GO_LIVE_CHECKLIST.md`.
