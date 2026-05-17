# Pix GO — Plataforma Drive-to-Store com Pix

**Stack:** NestJS + TypeORM + PostGIS + Redis | React PWA + Vite + Leaflet | Docker Compose

---

## Pré-requisitos

- Node.js >= 20
- Docker Desktop (para PostgreSQL + Redis)
- npm >= 10

---

## Setup Inicial

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env
# Preencher GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.

# 2. Subir banco e Redis
docker compose up -d

# 3. Instalar dependências da API
cd apps/api && npm install

# 4. Rodar migration inicial (cria todas as tabelas + extensões PostGIS)
npm run migration:run

# 5. Seed (global_margin=0.40, fase_monetizacao_ativa=false, tema_ativo=COPA)
npm run db:seed

# 6. Iniciar API em modo dev
npm run dev
# API: http://localhost:3000/api/v1
# Health: http://localhost:3000/api/v1/health
```

## PWA (Frontend)

```bash
cd apps/pwa && npm install && npm run dev
# PWA: http://localhost:5173
```

## Testes

```bash
cd apps/api
npm run test        # Testes unitários
npm run test:cov    # Com cobertura
npm run test:e2e    # E2E (requer banco rodando)
```

---

## Estrutura

```
pixgo/
├── apps/
│   ├── api/           # NestJS Backend (porta 3000)
│   └── pwa/           # React PWA (porta 5173)
├── packages/
│   └── portal-pj/     # Portal Lojista (fase 3)
├── docker-compose.yml
└── .env.example
```

## Fases de Implementação

| Fase | Escopo | Status |
|------|--------|--------|
| **0 — Fundação** | Docker, migrations PostGIS, Redis, domínio DDD, testes | ✅ |
| **1 — Álbum da Copa** | Google OAuth, pacotes georreferenciados, figurinhas, trocas PIN | 🔄 |
| **2 — Pix Real** | Upgrade conta CPF, moedas mapa, vídeo rewarded, WebAR, antifraude | ⏳ |
| **3 — Portal B2B** | CNPJ, campanhas smart blending, analytics | ⏳ |
| **4 — Saque Pix** | Liquidação automática, webhooks banco parceiro | ⏳ |
| **5 — Antifraude** | Rate limit Redis, HMAC payload, ST_Distance PostGIS | ⏳ |
| **6 — Admin/Temas** | CMS, temas sazonais, métricas master | ⏳ |
