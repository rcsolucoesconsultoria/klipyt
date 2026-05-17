import { DataSource } from 'typeorm';
import { Establishment } from '../../../domain/entities/establishment.entity';
import { StickerPack } from '../../../domain/entities/sticker-pack.entity';

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

export async function seedEstablishments(dataSource: DataSource): Promise<void> {
  const estRepo = dataSource.getRepository(Establishment);
  const packRepo = dataSource.getRepository(StickerPack);

  for (const data of MOCK_ESTABLISHMENTS) {
    const existing = await estRepo.findOne({ where: { cnpj: data.cnpj } });
    if (existing) continue;

    const geom = `SRID=4326;POINT(${data.lon} ${data.lat})`;
    const est = await estRepo.save(
      estRepo.create({
        cnpj_root: data.cnpj_root,
        cnpj: data.cnpj,
        trade_name: data.trade_name,
        address_text: data.address_text,
        geom,
        is_active: true,
      }),
    );

    const packGeomOffset = `SRID=4326;POINT(${data.lon + 0.0001} ${data.lat + 0.0001})`;
    await packRepo.save(
      packRepo.create({
        establishment_id: est.id,
        geom: packGeomOffset,
        is_active: true,
      }),
    );

    console.log(`Seed estabelecimento: ${data.trade_name}`);
  }
}
