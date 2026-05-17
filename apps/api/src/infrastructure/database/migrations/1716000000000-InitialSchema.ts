import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716000000000 implements MigrationInterface {
  name = 'InitialSchema1716000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_status_enum AS ENUM ('INCOMPLETE', 'VERIFIED', 'BANNED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE rarity_enum AS ENUM ('COMMON', 'RARE', 'LEGENDARY');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE campaign_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE reward_status_enum AS ENUM ('NOT_REDEEMED', 'REDEEMED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        avatar_url TEXT NULL,
        cpf VARCHAR(11) UNIQUE NULL,
        birth_date DATE NULL,
        pix_key VARCHAR(255) NULL,
        faixa_etaria VARCHAR(10) NULL,
        wallet_balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
        status user_status_enum DEFAULT 'INCOMPLETE',
        fraud_flag BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf) WHERE cpf IS NOT NULL`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS establishments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cnpj_root VARCHAR(14) NOT NULL,
        cnpj VARCHAR(14) UNIQUE NOT NULL,
        trade_name VARCHAR(255) NOT NULL,
        address_text TEXT NOT NULL,
        geom GEOMETRY(Point, 4326) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_establishments_geom ON establishments USING GIST (geom)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_establishments_cnpj_root ON establishments(cnpj_root)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS merchant_wallets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cnpj_root VARCHAR(14) UNIQUE NOT NULL,
        balance NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
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
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_establishment ON campaigns(establishment_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS financial_coins (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
        value NUMERIC(10, 2) NOT NULL,
        is_qualified BOOLEAN DEFAULT FALSE,
        geom GEOMETRY(Point, 4326) NOT NULL,
        collected_by UUID REFERENCES users(id) NULL,
        collected_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_financial_coins_geom ON financial_coins USING GIST (geom)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_financial_coins_campaign ON financial_coins(campaign_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sticker_packs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
        geom GEOMETRY(Point, 4326) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sticker_packs_geom ON sticker_packs USING GIST (geom)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS stickers (
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
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_stickers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sticker_id UUID REFERENCES stickers(id) ON DELETE CASCADE,
        quantity INT DEFAULT 1,
        is_glued BOOLEAN DEFAULT FALSE,
        reward_status reward_status_enum DEFAULT 'NOT_REDEEMED',
        qr_token VARCHAR(255) UNIQUE NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uniq_user_sticker UNIQUE (user_id, sticker_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS unified_collections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
        asset_type VARCHAR(20) NOT NULL,
        collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_unified_collections_rate
      ON unified_collections(user_id, establishment_id, asset_type, (collected_at::date))
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status tx_status_enum DEFAULT 'PENDING',
        end_to_end_id VARCHAR(255) NULL,
        processed_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_wallet_transactions_status ON wallet_transactions(status)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS wallet_transactions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS unified_collections CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_stickers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS stickers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS sticker_packs CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS financial_coins CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS campaigns CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS merchant_wallets CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS establishments CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS platform_settings CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS tx_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS reward_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS campaign_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS rarity_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_status_enum`);
  }
}
