import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction } from '../../../domain/entities/wallet-transaction.entity';
import { TxStatus } from '../../../domain/enums/tx-status.enum';
import { IWalletTransactionRepository } from '../../../use-cases/wallet/ports/wallet-transaction-repository.port';

@Injectable()
export class WalletTransactionRepository implements IWalletTransactionRepository {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly repo: Repository<WalletTransaction>,
  ) {}

  async create(data: Partial<WalletTransaction>): Promise<WalletTransaction> {
    return this.repo.save(this.repo.create(data));
  }

  async findById(id: string): Promise<WalletTransaction | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEndToEndId(endToEndId: string): Promise<WalletTransaction | null> {
    return this.repo.findOne({ where: { end_to_end_id: endToEndId } });
  }

  async updateStatus(id: string, status: TxStatus, endToEndId?: string): Promise<void> {
    const update: Partial<WalletTransaction> = {
      status,
      processed_at: new Date(),
    };
    if (endToEndId) update.end_to_end_id = endToEndId;
    await this.repo.update(id, update);
  }
}
