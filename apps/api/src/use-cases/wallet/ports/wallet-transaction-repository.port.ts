import { WalletTransaction } from '../../../domain/entities/wallet-transaction.entity';
import { TxStatus } from '../../../domain/enums/tx-status.enum';

export interface IWalletTransactionRepository {
  create(data: Partial<WalletTransaction>): Promise<WalletTransaction>;
  findById(id: string): Promise<WalletTransaction | null>;
  findByEndToEndId(endToEndId: string): Promise<WalletTransaction | null>;
  updateStatus(id: string, status: TxStatus, endToEndId?: string): Promise<void>;
}
