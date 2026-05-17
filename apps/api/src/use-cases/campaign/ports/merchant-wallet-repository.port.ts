import { MerchantWallet } from '../../../domain/entities/merchant-wallet.entity';

export interface IMerchantWalletRepository {
  findByCnpjRoot(cnpjRoot: string): Promise<MerchantWallet | null>;
  credit(cnpjRoot: string, amount: number): Promise<void>;
}
