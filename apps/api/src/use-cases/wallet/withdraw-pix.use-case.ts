import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TxStatus } from '../../domain/enums/tx-status.enum';
import { UserStatus } from '../../domain/enums/user-status.enum';
import {
  PAYMENT_GATEWAY,
  PaymentGatewayPort,
} from '../../infrastructure/payment/payment-gateway.port';
import { TOKENS } from '../tokens';
import { IUserRepository } from '../auth/ports/user-repository.port';
import { IWalletTransactionRepository } from './ports/wallet-transaction-repository.port';

const MIN_WITHDRAW = 6.0;

export interface WithdrawPixResult {
  transaction_id: string;
  amount: number;
  status: TxStatus;
}

@Injectable()
export class WithdrawPixUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TOKENS.WALLET_TRANSACTION_REPOSITORY)
    private readonly txRepo: IWalletTransactionRepository,
    @Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGatewayPort,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string): Promise<WithdrawPixResult> {
    const user = await this.users.findById(userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.status !== UserStatus.VERIFIED) {
      throw new ForbiddenException('Ative o Pix Real antes de sacar');
    }
    if (user.fraud_flag) {
      throw new ForbiddenException('Conta bloqueada para saques por suspeita de fraude');
    }
    if (!user.pix_key || !user.cpf) {
      throw new BadRequestException('Chave Pix não cadastrada');
    }

    const balance = Number(user.wallet_balance);
    if (balance < MIN_WITHDRAW) {
      throw new BadRequestException(
        `Saldo mínimo para saque é R$ ${MIN_WITHDRAW.toFixed(2)}. Saldo atual: R$ ${balance.toFixed(2)}`,
      );
    }

    const idempotencyKey = uuidv4();

    // Transação atômica: debitar saldo + criar registro PENDING
    const tx = await this.dataSource.transaction(async (em) => {
      await em.query(
        `UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2`,
        [balance, userId],
      );
      return this.txRepo.create({
        user_id: userId,
        amount: balance,
        status: TxStatus.PENDING,
      });
    });

    // Dispara requisição ao gateway Pix (assíncrono)
    try {
      const result = await this.gateway.requestWithdraw({
        amountBrl: balance,
        pixKeyType: 'CPF',
        pixKeyValue: user.pix_key,
        idempotencyKey,
        description: `Saque Pix GO - usuário ${userId}`,
      });

      if (result.endToEndId) {
        await this.txRepo.updateStatus(tx.id, TxStatus.PENDING, result.endToEndId);
      }
    } catch (err) {
      // Estornar em caso de falha na chamada ao gateway
      await this.dataSource.query(
        `UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2`,
        [balance, userId],
      );
      await this.txRepo.updateStatus(tx.id, TxStatus.FAILED);
      throw new BadRequestException(`Falha ao processar saque: ${(err as Error).message}`);
    }

    return { transaction_id: tx.id, amount: balance, status: TxStatus.PENDING };
  }
}
