import { DataSource } from 'typeorm';
import Redis from 'ioredis';
import { DensityTier } from '../../../domain/enums/density-tier.enum';

export async function seedBillboards(ds: DataSource, redis: Redis) {
  const existing = await ds.query(`SELECT COUNT(*)::int AS c FROM virtual_billboards`);
  if (existing[0]?.c > 0) {
    console.log('Billboards já existem — pulando.');
    return;
  }

  const [est] = await ds.query(`SELECT id FROM establishments LIMIT 1`);
  const establishmentId = est?.id ?? null;

  const rows = await ds.query(
    `INSERT INTO virtual_billboards
      (establishment_id, title, density_tier, model_glb_url, creative_video_url, geom, is_active)
     VALUES
      ($1, 'Outdoor Paulista', 'OURO', 'https://cdn.klipyt.com/models/billboard.glb', NULL,
       ST_SetSRID(ST_MakePoint(-46.655, -23.563), 4326), true),
      ($1, 'Outdoor Pinheiros', 'PRATA', 'https://cdn.klipyt.com/models/billboard.glb', NULL,
       ST_SetSRID(ST_MakePoint(-46.689, -23.567), 4326), true)
     RETURNING id, ST_X(geom::geometry) AS lon, ST_Y(geom::geometry) AS lat, title, density_tier, model_glb_url`,
    [establishmentId],
  );

  for (const row of rows) {
    await redis.geoadd('billboards:geo', row.lon, row.lat, row.id);
    await redis.hset(`billboard:${row.id}:meta`, {
      title: row.title,
      density_tier: row.density_tier,
      model_glb_url: row.model_glb_url,
    });
  }

  console.log(`Billboards: ${rows.length} outdoors virtuais criados.`);
}
