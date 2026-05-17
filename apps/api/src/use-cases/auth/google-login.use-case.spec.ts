import { GoogleLoginUseCase } from './google-login.use-case';
import { UserStatus } from '../../domain/enums/user-status.enum';

const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  save: jest.fn(),
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('GoogleLoginUseCase (UC01)', () => {
  let useCase: GoogleLoginUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new GoogleLoginUseCase(mockUserRepo as any, mockJwt as any);
  });

  it('cria usuário com status INCOMPLETE quando e-mail não existe (RF05 Fase 1)', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockUserRepo.save.mockResolvedValue({
      id: 'uuid-1',
      email: 'usuario@gmail.com',
      full_name: 'João Silva',
      avatar_url: null,
      status: UserStatus.INCOMPLETE,
    });

    const result = await useCase.execute({
      email: 'usuario@gmail.com',
      full_name: 'João Silva',
      avatar_url: null,
    });

    expect(mockUserRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'usuario@gmail.com',
        status: UserStatus.INCOMPLETE,
        cpf: null,
        birth_date: null,
        pix_key: null,
      }),
    );
    expect(result.access_token).toBe('mock.jwt.token');
    expect(result.user.status).toBe(UserStatus.INCOMPLETE);
  });

  it('retorna usuário existente sem criar novo registro', async () => {
    const existingUser = {
      id: 'uuid-existing',
      email: 'existente@gmail.com',
      full_name: 'Maria',
      avatar_url: null,
      status: UserStatus.INCOMPLETE,
    };
    mockUserRepo.findByEmail.mockResolvedValue(existingUser);

    const result = await useCase.execute({
      email: 'existente@gmail.com',
      full_name: 'Maria',
      avatar_url: null,
    });

    expect(mockUserRepo.save).not.toHaveBeenCalled();
    expect(result.user.id).toBe('uuid-existing');
  });
});
