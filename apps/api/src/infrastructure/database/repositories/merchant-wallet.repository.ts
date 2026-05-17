import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MerchantWallet } from '../../../domain/entities/merchant-wallet.entity';
import { IMerchantWalletRepository } from '../../../use-cases/campaign/ports/merchant-wallet-repository.port';

@Injectable()
export class MerchantWalletRepository implements IMerchantWalletRepository {
  constructor(
    @InjectRepository(MerchantWallet)
    private readonly repo: Repository<MerchantWallet>,
  ) {}

  async findByCnpjRoot(cnpjRoot: string): Promise<MerchantWallet | null> {
    return this.repo.findOne({ where: { cnpj_root: cnpjRoot } });
  }

  async credit(cnpjRoot: string, amount: number): Promise<void> {
    const existing = await this.findByCnpjRoot(cnpjRoot);
    if (existing) {
      await this.repo.query(
        `UPDATE merchant_wallets SET balance = balance + $1 WHERE cnpj_root = $2`,
        [amount, cnpjRoot],
      );
    } else {
      await this.repo.save(this.repo.create({ cnpj_root: cnpjRoot, balance: amount }));
    }
  }
}
