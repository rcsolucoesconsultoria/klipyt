import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '../../domain/enums/user-status.enum';
import { Cpf } from '../../domain/value-objects/cpf.vo';
import { IUserRepository } from '../auth/ports/user-repository.port';
import { IBureauApi } from './ports/bureau-api.port';
import { TOKENS } from '../tokens';

export interface UpgradeAccountInput {
  userId: string;
  rawCpf: string;
  pixKey: string;
}

export interface UpgradeAccountResult {
  status: UserStatus;
  faixa_etaria: string;
  access_token: string;
}

@Injectable()
export class UpgradeAccountUseCase {
  constructor(
    @Inject(TOKENS.USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(TOKENS.BUREAU_API) private readonly bureau: IBureauApi,
    private readonly jwt: JwtService,
  ) {}

  async execute(input: UpgradeAccountInput): Promise<UpgradeAccountResult> {
    let cpfVo: Cpf;
    try {
      cpfVo = new Cpf(input.rawCpf);
    } catch {
      throw new BadRequestException('CPF inválido');
    }

    const cpfStr = cpfVo.toString();

    // Chave Pix deve ser o próprio CPF (RF05)
    const pixKeyDigits = input.pixKey.replace(/\D/g, '');
    if (pixKeyDigits !== cpfStr) {
      throw new BadRequestException(
        'A chave Pix deve ser do tipo CPF e corresponder ao CPF informado (RF05)',
      );
    }

    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundException('Usuário não encontrado');

    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Conta suspensa');
    }

    const bureauData = await this.bureau.lookupCpf(cpfStr);

    const today = new Date();
    const birth = new Date(bureauData.birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;

    if (age < 18) {
      throw new UnprocessableEntityException(
        'Usuário deve ter 18 anos ou mais para usar o Pix Real',
      );
    }

    const faixa_etaria = age >= 35 ? '35+' : 'LIVRE';

    await this.users.save({
      ...user,
      cpf: cpfStr,
      pix_key: cpfStr,
      birth_date: bureauData.birthDate,
      faixa_etaria,
      status: UserStatus.VERIFIED,
    });

    const access_token = this.jwt.sign({
      sub: user.id,
      email: user.email,
      status: UserStatus.VERIFIED,
      faixa_etaria,
    });

    return { status: UserStatus.VERIFIED, faixa_etaria, access_token };
  }
}
