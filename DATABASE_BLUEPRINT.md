# 🗄️ Blueprint de Banco de Dados Completo — Pix GO

## 1. Modelo Relacional PostgreSQL + Extensão Espacial PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Definição de Tipos ENUM Estritos de Controle de Fluxo
CREATE TYPE user_status_enum AS ENUM ('INCOMPLETE', 'VERIFIED', 'BANNED');
CREATE TYPE rarity_enum AS ENUM ('COMMON', 'RARE', 'LEGENDARY');
CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
CREATE TYPE reward_status_enum AS ENUM ('NOT_REDEEMED', 'REDEEMED');
CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- 0. Configurações Globais da Plataforma (RF14, RN01, RF10)
CREATE TABLE platform_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Seeds: global_margin=0.40, fase_monetizacao_ativa=false, tema_ativo='COPA'

-- 1. Tabela Principal de Usuários (Onboarding Progressivo)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT NULL,
    cpf VARCHAR(11) UNIQUE NULL,            -- Armazenado apenas na Fase 2
    birth_date DATE NULL,                   -- Armazenado apenas na Fase 2
    pix_key VARCHAR(255) NULL,              -- Armazenado apenas na Fase 2
    faixa_etaria VARCHAR(10) NULL,          -- 'LIVRE' ou '35+' (Fase 2)
    wallet_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    status user_status_enum DEFAULT 'INCOMPLETE',
    fraud_flag BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL;

-- 2. Tabela de Estabelecimentos Comerciais (Filiais Geocodificadas - RF01)
CREATE TABLE establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) NOT NULL,         -- CNPJ da matriz (raiz cadastral)
    cnpj VARCHAR(14) UNIQUE NOT NULL,       -- CNPJ da filial individual
    trade_name VARCHAR(255) NOT NULL,
    address_text TEXT NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,    -- Ponto WGS84
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_establishments_geom ON establishments USING GIST (geom);
CREATE INDEX idx_establishments_cnpj_root ON establishments(cnpj_root);

-- 2b. Carteira PJ para crédito de orçamento não consumido (RF04)
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj_root VARCHAR(14) UNIQUE NOT NULL,
    balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Campanhas Publicitárias Monetizadas (Fase 2)
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    budget_gross NUMERIC(10, 2) NOT NULL,
    budget_net NUMERIC(10, 2) NOT NULL,
    app_margin_percent NUMERIC(5, 2) DEFAULT 40.00,
    video_url TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    age_restriction INT NULL,
    status campaign_status_enum DEFAULT 'DRAFT',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_campaigns_establishment ON campaigns(establishment_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- 4. Tabela de Moedas Financeiras Georreferenciadas (Fase 2 - Smart Blending)
CREATE TABLE financial_coins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    value NUMERIC(10, 2) NOT NULL,
    is_qualified BOOLEAN DEFAULT FALSE,     -- true = Baú de Ouro (60%), false = Bronze (40%)
    geom GEOMETRY(Point, 4326) NOT NULL,
    collected_by UUID REFERENCES users(id) NULL,
    collected_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_financial_coins_geom ON financial_coins USING GIST (geom);
CREATE INDEX idx_financial_coins_campaign ON financial_coins(campaign_id);

-- 5. Pontos de Coleta de Pacotes do Álbum no Mapa (RF12)
CREATE TABLE sticker_packs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    geom GEOMETRY(Point, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sticker_packs_geom ON sticker_packs USING GIST (geom);

-- 6. Tabela do Catálogo de Figurinhas Patrocinadas (Módulo do Álbum - Fase 1)
CREATE TABLE stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    sticker_number INT UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    page_number INT NOT NULL,
    rarity rarity_enum DEFAULT 'COMMON',
    image_url TEXT NOT NULL,
    has_reward BOOLEAN DEFAULT FALSE,
    reward_description TEXT NULL,
    reward_code VARCHAR(50) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Inventário de Figurinhas e Cupons dos Usuários (Fase 1)
CREATE TABLE user_stickers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    is_glued BOOLEAN DEFAULT FALSE,
    reward_status reward_status_enum DEFAULT 'NOT_REDEEMED',
    qr_token VARCHAR(255) UNIQUE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_user_sticker UNIQUE (user_id, sticker_id)
);

-- 8. Tabela do Histórico Unificado de Coletas (Controle de Rate Limiting de 24 horas)
CREATE TABLE unified_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
    asset_type VARCHAR(20) NOT NULL,        -- 'STICKER_PACK' ou 'FINANCIAL_COIN'
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_unified_collections_rate ON unified_collections(user_id, establishment_id, asset_type, collected_at);

-- 9. Tabela de Transações Financeiras e Histórico de Saques (Wallet - Fase 2)
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status tx_status_enum DEFAULT 'PENDING',
    end_to_end_id VARCHAR(255) NULL,
    processed_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_transactions_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_transactions_status ON wallet_transactions(status);
```

## 2. Topologia de Chaves e Estruturas em Memória (Redis)

| Chave / Padrão | Tipo | TTL | Descrição |
|----------------|------|-----|-----------|
| `active_coins:geo` | GEO | Até fim da campanha | Moedas financeiras ativas. `GEOADD active_coins:geo {longitude} {latitude} {coin_id}` |
| `active_packs:geo` | GEO | Vigência do álbum | Pacotes de figurinhas no mapa. `GEOADD active_packs:geo {longitude} {latitude} {establishment_id}` |
| `campaign:{id}:coins` | Hash | Até fim da campanha | Metadados: valor, `is_qualified`, `age_restriction`, `establishment_id` |
| `trade:pin:{codigo}` | Hash | 120 segundos | Troca local RF13. Campos: `sender_id`, `sticker_id`, `lat`, `lon` |
| `rate:cpf:{cpf}:est:{establishment_id}` | String | 86400 segundos | RN03 — 1 moeda / 24h por filial |
| `rate:cpf:{cpf}:pack:{establishment_id}` | String | 86400 segundos | RN03 — máximo 2 pacotes / 24h por filial |
| `video:token:{user_id}:{coin_id}` | String | 300 segundos | Token pós-vídeo RF07 |
| `session:jwt:blacklist:{jti}` | String | Expiração JWT | Revogação de tokens |

**Fluxo de consulta do mapa (UC06):**
1. `GEOSEARCH active_coins:geo FROMLONLAT {lon} {lat} BYRADIUS 5 km` para moedas próximas.
2. `HGETALL campaign:{id}:coins` para enriquecer flags de qualificação.
3. Filtro de visibilidade por `faixa_etaria` antes de serializar JSON para o PWA.

**Fluxo de pacotes do álbum (UC08):**
1. `GEOSEARCH active_packs:geo` no raio de 5 km.
2. Validação de proximidade e rate limit antes de `POST /api/v1/album/open-pack`.