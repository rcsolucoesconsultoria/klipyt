# 🗄️ Blueprint de Banco de Dados Completo — KLIPYT

**Domínio:** https://klipyt.com  
**SGBD:** PostgreSQL 15 + PostGIS 3.3  
**Cache:** Redis 7  

---

## 1. Modelo Relacional PostgreSQL + PostGIS

```sql
-- Extensões obrigatórias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- ENUMs de controle de fluxo
CREATE TYPE user_status_enum AS ENUM ('INCOMPLETE', 'VERIFIED', 'BANNED');
CREATE TYPE rarity_enum AS ENUM ('COMMON', 'RARE', 'LEGENDARY');
CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
CREATE TYPE reward_status_enum AS ENUM ('NOT_REDEEMED', 'REDEEMED');
CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE density_tier_enum AS ENUM ('OURO', 'PRATA', 'BRONZE');
CREATE TYPE rental_status_enum AS ENUM ('RESERVED', 'ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE marketplace_status_enum AS ENUM ('LISTED', 'PENDING', 'COMPLETED', 'CANCELLED');

-- Configurações globais (RN01, RN03, RN04, RN05)
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Seeds recomendados:
-- INSERT INTO platform_settings VALUES
-- ('GLOBAL_MARGIN', '0.40'),
-- ('MARKETPLACE_FEE', '0.10'),
-- ('MIN_WITHDRAWAL_BRL', '6.00'),
-- ('MAX_CAPTURE_RADIUS_M', '25'),
-- ('PIX_PROVIDER', '"C6_BANK_BAAS"'),
-- ('SMART_BLEND_QUALIFIED', '0.60'),
-- ('SMART_BLEND_VOLUME', '0.40');

-- Usuários B2C (onboarding progressivo)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    cpf VARCHAR(11) UNIQUE NULL,
    birth_date DATE NULL,
    pix_key VARCHAR(255) NULL,
    faixa_etaria VARCHAR(10) NULL,
    wallet_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    status user_status_enum DEFAULT 'INCOMPLETE',
    fraud_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_users_status ON users(status);

-- Estabelecimentos comerciais (filiais geocodificadas)
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) NOT NULL,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    address_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_establishments_geom ON establishments USING GIST (geom);
CREATE INDEX idx_establishments_cnpj_root ON establishments(cnpj_root);
CREATE INDEX idx_establishments_active ON establishments(is_active) WHERE is_active = TRUE;

-- Carteira PJ (crédito de orçamento não consumido)
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) UNIQUE NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Campanhas publicitárias monetizadas
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    budget_gross NUMERIC(12, 2) NOT NULL,
    budget_net NUMERIC(12, 2) NOT NULL,
    app_margin_percent NUMERIC(5, 2) DEFAULT 40.00,
    video_url TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    age_restriction INT NULL,
    status campaign_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_campaigns_establishment ON campaigns(establishment_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_window ON campaigns(start_time, end_time);

-- Catálogo de emissão de moedas colecionáveis (RF16)
CREATE TABLE coin_catalogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NULL REFERENCES campaigns(id) ON DELETE SET NULL,
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    face_value NUMERIC(10, 2) NOT NULL,
    budget_gross NUMERIC(12, 2) NOT NULL,
    budget_net NUMERIC(12, 2) NOT NULL,
    quantity_issued INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_coin_catalogs_establishment ON coin_catalogs(establishment_id);
CREATE INDEX idx_coin_catalogs_campaign ON coin_catalogs(campaign_id);

-- Moedas financeiras / colecionáveis georreferenciadas
CREATE TABLE financial_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    catalog_id UUID NULL REFERENCES coin_catalogs(id) ON DELETE SET NULL,
    value NUMERIC(10, 2) NOT NULL,
    is_qualified BOOLEAN DEFAULT FALSE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    owner_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    collected_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    collected_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financial_coins_geom ON financial_coins USING GIST (geom);
CREATE INDEX idx_financial_coins_campaign ON financial_coins(campaign_id);
CREATE INDEX idx_financial_coins_catalog ON financial_coins(catalog_id);
CREATE INDEX idx_financial_coins_owner ON financial_coins(owner_user_id);

-- Outdoors virtuais 3D DOOH (RF15)
CREATE TABLE virtual_billboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NULL REFERENCES establishments(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    density_tier density_tier_enum NOT NULL DEFAULT 'PRATA',
    model_glb_url TEXT NOT NULL,
    creative_video_url TEXT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_virtual_billboards_geom ON virtual_billboards USING GIST (geom);
CREATE INDEX idx_virtual_billboards_tier ON virtual_billboards(density_tier);

-- Locações de outdoors (B2B)
CREATE TABLE billboard_rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    billboard_id UUID NOT NULL REFERENCES virtual_billboards(id) ON DELETE CASCADE,
    merchant_cnpj_root VARCHAR(14) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    price_paid NUMERIC(12, 2) NOT NULL,
    status rental_status_enum DEFAULT 'RESERVED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_billboard_rentals_billboard ON billboard_rentals(billboard_id);
CREATE INDEX idx_billboard_rentals_window ON billboard_rentals(billboard_id, start_time, end_time);
CREATE INDEX idx_billboard_rentals_merchant ON billboard_rentals(merchant_cnpj_root);

-- Catálogo de figurinhas / cards colecionáveis
CREATE TABLE stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    sticker_number INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    page_number INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    image_url TEXT NOT NULL,
    has_reward BOOLEAN DEFAULT FALSE,
    reward_description TEXT NULL,
    reward_code VARCHAR(50) NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_sticker_number UNIQUE (establishment_id, sticker_number)
);
CREATE INDEX idx_stickers_establishment ON stickers(establishment_id);
CREATE INDEX idx_stickers_rarity ON stickers(rarity);

-- Inventário de figurinhas por usuário
CREATE TABLE user_stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sticker_id UUID NOT NULL REFERENCES stickers(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 NOT NULL,
    is_glued BOOLEAN DEFAULT FALSE,
    reward_status reward_status_enum DEFAULT 'NOT_REDEEMED',
    qr_token VARCHAR(255) UNIQUE NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_user_sticker UNIQUE (user_id, sticker_id)
);
CREATE INDEX idx_user_stickers_user ON user_stickers(user_id);
CREATE INDEX idx_user_stickers_reward ON user_stickers(reward_status);

-- Histórico unificado de coletas (rate limiting 24h)
CREATE TABLE unified_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
    asset_type VARCHAR(30) NOT NULL,
    asset_id UUID NULL,
    collected_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unified_collections_rate ON unified_collections(user_id, establishment_id, asset_type, collected_at DESC);

-- Transações de carteira e saques Pix C6
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    status tx_status_enum DEFAULT 'PENDING',
    pix_provider VARCHAR(50) DEFAULT 'C6_BANK_BAAS',
    end_to_end_id VARCHAR(255) NULL,
    processed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);

-- Ordens do marketplace P2P (RN03 — 10% fee)
CREATE TABLE marketplace_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    coin_id UUID NOT NULL REFERENCES financial_coins(id) ON DELETE CASCADE,
    list_price NUMERIC(12, 2) NOT NULL,
    platform_fee NUMERIC(12, 2) NOT NULL,
    seller_net NUMERIC(12, 2) NOT NULL,
    status marketplace_status_enum DEFAULT 'LISTED',
    completed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_marketplace_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_marketplace_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_coin ON marketplace_orders(coin_id);
```

---

## 2. Topologia Redis (KLIPYT)

| Chave / Padrão | Tipo | TTL | Descrição |
|----------------|------|-----|-----------|
| `active_coins:geo` | GEO | Até fim da campanha | Moedas ativas no mapa. `GEOADD active_coins:geo {lon} {lat} {coin_id}` |
| `billboards:geo` | GEO | Vigência da locação | Outdoors virtuais ativos para WebAR B2C |
| `coin:stock:{catalog_id}` | String (INT) | Até esgotar | Estoque restante da emissão UC07 |
| `campaign:{id}:meta` | Hash | Até fim da campanha | `budget_net`, `age_restriction`, `is_qualified` |
| `video:token:{user_id}:{coin_id}` | String | 300s | Autorização pós-vídeo antes da captura WebAR |
| `rate:cpf:{cpf}:est:{establishment_id}:coin` | String | 86400s | RN05 — 1 moeda financeira / 24h / filial |
| `rate:cpf:{cpf}:est:{establishment_id}:pack` | String | 86400s | RN05 — 2 pacotes / 24h / filial |
| `marketplace:lock:{coin_id}` | String | 60s | Lock otimista na compra P2P UC08 |
| `billboard:impressions:{rental_id}` | String (INT) | 30 dias | Contador de impressões WebAR UC10 |
| `session:jwt:blacklist:{jti}` | String | Expiração JWT | Revogação de tokens |

**Fluxo mapa (UC04):** `GEOSEARCH active_coins:geo FROMLONLAT {lon} {lat} BYRADIUS 5 km` → filtro `is_qualified` + `age_restriction` → JSON PWA.

**Fluxo emissão (UC07):** Transação SQL em `coin_catalogs` + `financial_coins` → `SET coin:stock:{catalog_id}` + `GEOADD` em lote.

**Fluxo marketplace (UC08):** `SET marketplace:lock:{coin_id} NX EX 60` → débito/crédito → `DEL lock` → status `COMPLETED`.