import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async geoadd(key: string, lon: number, lat: number, member: string): Promise<void> {
    await this.redis.geoadd(key, lon, lat, member);
  }

  async geosearch(
    key: string,
    lon: number,
    lat: number,
    radiusKm: number,
  ): Promise<string[]> {
    return (this.redis as any).call(
      'GEOSEARCH',
      key,
      'FROMLONLAT',
      lon,
      lat,
      'BYRADIUS',
      radiusKm,
      'km',
      'ASC',
    ) as Promise<string[]>;
  }

  async hset(key: string, data: Record<string, string | number>): Promise<void> {
    const args: (string | number)[] = [];
    for (const [field, value] of Object.entries(data)) {
      args.push(field, value);
    }
    await (this.redis as any).hset(key, ...args);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.redis.hgetall(key);
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    if (exSeconds) {
      await this.redis.set(key, value, 'EX', exSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.redis.zrem(key, member);
  }

  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const newVal = await this.redis.incr(key);
    if (newVal === 1) await this.redis.expire(key, ttlSeconds);
    return newVal;
  }

  async geopos(key: string, member: string): Promise<[number, number] | null> {
    const result = await this.redis.geopos(key, member);
    if (!result || !result[0]) return null;
    return [parseFloat(result[0][0] as string), parseFloat(result[0][1] as string)];
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.redis.hget(key, field);
  }
}
