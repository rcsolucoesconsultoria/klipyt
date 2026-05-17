import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBureauApi, BureauApiResult } from '../../use-cases/user/ports/bureau-api.port';

@Injectable()
export class BureauApiService implements IBureauApi {
  private readonly logger = new Logger(BureauApiService.name);

  constructor(private readonly config: ConfigService) {}

  async lookupCpf(cpf: string): Promise<BureauApiResult> {
    const apiKey = this.config.get<string>('BUREAU_API_KEY');

    if (!apiKey || this.config.get('NODE_ENV') === 'development') {
      this.logger.warn(`[mock] Bureau lookup CPF: ${cpf.slice(0, 3)}***.***-**`);
      return {
        fullName: 'USUÁRIO DEMO',
        birthDate: new Date('1990-06-15'),
      };
    }

    const res = await fetch(`https://api.serpro.gov.br/consulta-cpf-df/v1/cpf/${cpf}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Bureau API ${res.status}`);
    const data: any = await res.json();
    return {
      fullName: data.nome,
      birthDate: new Date(data.nascimento),
    };
  }
}
