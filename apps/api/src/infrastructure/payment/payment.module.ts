import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PAYMENT_GATEWAY } from './payment-gateway.port';
import { C6PixGateway } from './c6/c6-pix.gateway';
import { MockPaymentGateway } from './mock-payment.gateway';

@Module({
  imports: [ConfigModule],
  providers: [
    C6PixGateway,
    MockPaymentGateway,
    {
      provide: PAYMENT_GATEWAY,
      inject: [ConfigService, C6PixGateway, MockPaymentGateway],
      useFactory: (
        config: ConfigService,
        c6: C6PixGateway,
        mock: MockPaymentGateway,
      ) => {
        const gateway = config.get<string>('PIX_GATEWAY', 'mock');
        return gateway === 'c6' ? c6 : mock;
      },
    },
  ],
  exports: [PAYMENT_GATEWAY, C6PixGateway],
})
export class PaymentModule {}
