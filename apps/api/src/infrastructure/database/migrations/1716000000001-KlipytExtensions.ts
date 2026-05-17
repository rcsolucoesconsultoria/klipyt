import { MigrationInterface, QueryRunner } from 'typeorm';

export class KlipytExtensions1716000000001 implements MigrationInterface {
  name = 'KlipytExtensions1716000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE density_tier_enum AS ENUM ('OURO', 'PRATA', 'BRONZE');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE rental_status_enum AS ENUM ('RESERVED', 'ACTIVE', 'CANCELLED', 'COMPLETED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE marketplace_status_enum AS ENUM ('LISTED', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS coin_catalogs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
        establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        face_value NUMERIC(10, 2) NOT NULL,
        budget_gross NUMERIC(12, 2) NOT NULL,
        budget_net NUMERIC(12, 2) NOT NULL,
        quantity_issued INT NOT NULL,
        rarity rarity_enum DEFAULT 'COMMON',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_coin_catalogs_campaign ON coin_catalogs(campaign_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_coin_catalogs_establishment ON coin_catalogs(establishment_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS virtual_billboards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        establishment_id UUID REFERENCES establishments(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        density_tier density_tier_enum DEFAULT 'PRATA',
        model_glb_url TEXT NOT NULL,
        creative_video_url TEXT NULL,
        geom GEOMETRY(Point, 4326) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_virtual_billboards_geom ON virtual_billboards USING GIST (geom)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS billboard_rentals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        billboard_id UUID NOT NULL REFERENCES virtual_billboards(id) ON DELETE CASCADE,
        merchant_cnpj_root VARCHAR(14) NOT NULL,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        price_paid NUMERIC(12, 2) NOT NULL,
        status rental_status_enum DEFAULT 'RESERVED',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_billboard_rentals_billboard ON billboard_rentals(billboard_id)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS marketplace_orders (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
        coin_id UUID NOT NULL REFERENCES financial_coins(id) ON DELETE CASCADE,
        list_price NUMERIC(12, 2) NOT NULL,
        platform_fee NUMERIC(12, 2) NOT NULL,
        seller_net NUMERIC(12, 2) NOT NULL,
        status marketplace_status_enum DEFAULT 'LISTED',
        completed_at TIMESTAMP WITH TIME ZONE NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller ON marketplace_orders(seller_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_orders_buyer ON marketplace_orders(buyer_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_marketplace_orders_coin ON marketplace_orders(coin_id)`);

    await queryRunner.query(`
      ALTER TABLE financial_coins
        ADD COLUMN IF NOT EXISTS catalog_id UUID REFERENCES coin_catalogs(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_financial_coins_catalog ON financial_coins(catalog_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_financial_coins_owner ON financial_coins(owner_user_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE financial_coins DROP COLUMN IF EXISTS owner_user_id`);
    await queryRunner.query(`ALTER TABLE financial_coins DROP COLUMN IF EXISTS catalog_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS marketplace_orders CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS billboard_rentals CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS virtual_billboards CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS coin_catalogs CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS marketplace_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS rental_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS density_tier_enum`);
  }
}
