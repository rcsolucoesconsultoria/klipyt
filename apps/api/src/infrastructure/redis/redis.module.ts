import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
          lazyConnect: false,
          retryStrategy: (times) => Math.min(times * 100, 3000),
        });
        client.on('error', (err) => console.error('[Redis] Error:', err.message));
        client.on('connect', () => console.log('[Redis] Connected'));
        return client;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule {}
