import { UpgradeAccountUseCase } from './upgrade-account.use-case';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

const mockUserRepo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  save: jest.fn(),
};

const mockBureau = {
  lookupCpf: jest.fn(),
};

describe('UpgradeAccountUseCase (UC02)', () => {
  let useCase: UpgradeAccountUseCase;

  const baseUser = {
    id: 'user-1',
    email: 'user@test.com',
    full_name: 'Test',
    status: UserStatus.INCOMPLETE,
    fraud_flag: false,
    wallet_balance: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new UpgradeAccountUseCase(mockUserRepo as any, mockBureau as any);
    mockUserRepo.findById.mockResolvedValue(baseUser);
    mockUserRepo.save.mockImplementation((u) => Promise.resolve(u));
  });

  it('valida CPF e muda status para VERIFIED com faixa_etaria correta', async () => {
    mockBureau.lookupCpf.mockResolvedValue({
      fullName: 'CARLOS SILVA',
      birthDate: new Date('1988-03-10'),
    });

    const result = await useCase.execute({
      userId: 'user-1',
      rawCpf: '529.982.247-25',
      pixKey: '52998224725',
    });

    expect(result.status).toBe(UserStatus.VERIFIED);
    expect(result.faixa_etaria).toBe('35+');
    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: UserStatus.VERIFIED, faixa_etaria: '35+' }),
    );
  });

  it('bloqueia menor de 18 anos', async () => {
    mockBureau.lookupCpf.mockResolvedValue({
      fullName: 'JOVEM TESTE',
      birthDate: new Date('2010-01-01'),
    });

    await expect(
      useCase.execute({ userId: 'user-1', rawCpf: '529.982.247-25', pixKey: '52998224725' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejeita quando chave Pix não é o CPF (RF05)', async () => {
    await expect(
      useCase.execute({ userId: 'user-1', rawCpf: '529.982.247-25', pixKey: 'chave-aleatoria' }),
    ).rejects.toThrow(BadRequestException);
  });
});
