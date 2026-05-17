import { WithdrawPixUseCase } from './withdraw-pix.use-case';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { TxStatus } from '../../domain/enums/tx-status.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockUserRepo = { findById: jest.fn(), findByEmail: jest.fn(), save: jest.fn() };
const mockTxRepo = { create: jest.fn(), findById: jest.fn(), findByEndToEndId: jest.fn(), updateStatus: jest.fn() };
const mockGateway = { requestWithdraw: jest.fn(), registerWebhook: jest.fn() };
const mockDataSource = {
  transaction: jest.fn(),
  query: jest.fn(),
};

describe('WithdrawPixUseCase (UC11)', () => {
  let useCase: WithdrawPixUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new WithdrawPixUseCase(
      mockUserRepo as any,
      mockTxRepo as any,
      mockGateway as any,
      mockDataSource as any,
    );
  });

  it('processa saque com saldo de R$ 8,50', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'u1', status: UserStatus.VERIFIED, fraud_flag: false,
      wallet_balance: 8.50, cpf: '52998224725', pix_key: '52998224725',
    });
    mockDataSource.transaction.mockImplementation(async (fn: any) => {
      const result = await fn({ query: jest.fn() });
      return result;
    });
    mockTxRepo.create.mockResolvedValue({ id: 'tx-1', amount: 8.50 });
    mockGateway.requestWithdraw.mockResolvedValue({ externalId: 'ext-1', status: 'PENDING', endToEndId: 'E123' });
    mockTxRepo.updateStatus.mockResolvedValue(undefined);

    const result = await useCase.execute('u1');
    expect(result.amount).toBe(8.50);
    expect(result.status).toBe(TxStatus.PENDING);
    expect(mockGateway.requestWithdraw).toHaveBeenCalled();
  });

  it('bloqueia saque com saldo abaixo de R$ 6,00', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'u1', status: UserStatus.VERIFIED, fraud_flag: false,
      wallet_balance: 4.20, cpf: '52998224725', pix_key: '52998224725',
    });

    await expect(useCase.execute('u1')).rejects.toThrow(BadRequestException);
  });

  it('bloqueia usuário com fraud_flag=true', async () => {
    mockUserRepo.findById.mockResolvedValue({
      id: 'u1', status: UserStatus.VERIFIED, fraud_flag: true,
      wallet_balance: 10, cpf: '52998224725', pix_key: '52998224725',
    });

    await expect(useCase.execute('u1')).rejects.toThrow(ForbiddenException);
  });
});
