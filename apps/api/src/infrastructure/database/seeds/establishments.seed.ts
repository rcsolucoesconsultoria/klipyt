import { DataSource } from 'typeorm';
import Redis from 'ioredis';

const MOCK_ESTABLISHMENTS = [
  {
    cnpj_root: '11222333',
    cnpj: '11222333000101',
    trade_name: 'Castelo Forte - Unidade Centro',
    address_text: 'Rua da Consolação, 2100 - Consolação, São Paulo - SP',
    lat: -23.55195,
    lon: -46.65938,
  },
  {
    cnpj_root: '44555666',
    cnpj: '44555666000102',
    trade_name: 'Mercado Bom Preço - Pinheiros',
    address_text: 'Rua dos Pinheiros, 800 - Pinheiros, São Paulo - SP',
    lat: -23.56332,
    lon: -46.68278,
  },
  {
    cnpj_root: '77888999',
    cnpj: '77888999000103',
    trade_name: 'Livraria Cultura - Paulista',
    address_text: 'Av. Paulista, 2073 - Bela Vista, São Paulo - SP',
    lat: -23.56388,
    lon: -46.65278,
  },
];

export async function seedEstablishments(
  dataSource: DataSource,
  redis?: Redis,
): Promise<void> {
  for (const data of MOCK_ESTABLISHMENTS) {
    const [existing] = await dataSource.query(
      `SELECT id FROM establishments WHERE cnpj = $1 LIMIT 1`,
      [data.cnpj],
    );

    if (existing) {
      const [pack] = await dataSource.query(
        `SELECT id FROM sticker_packs WHERE establishment_id = $1 LIMIT 1`,
        [existing.id],
      );
      if (redis && pack?.id) {
        await redis.geoadd('active_packs:geo', data.lon + 0.0001, data.lat + 0.0001, pack.id);
      }
      continue;
    }

    const [est] = await dataSource.query(
      `INSERT INTO establishments (cnpj_root, cnpj, trade_name, address_text, geom, is_active)
       VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326), true)
       RETURNING id`,
      [data.cnpj_root, data.cnpj, data.trade_name, data.address_text, data.lon, data.lat],
    );

    const packLon = data.lon + 0.0001;
    const packLat = data.lat + 0.0001;

    const [pack] = await dataSource.query(
      `INSERT INTO sticker_packs (establishment_id, geom, is_active)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), true)
       RETURNING id`,
      [est.id, packLon, packLat],
    );

    if (redis && pack?.id) {
      await redis.geoadd('active_packs:geo', packLon, packLat, pack.id);
      console.log(`GEOADD pack ${pack.id} → active_packs:geo`);
    }

    console.log(`Seed estabelecimento: ${data.trade_name}`);
  }
}
