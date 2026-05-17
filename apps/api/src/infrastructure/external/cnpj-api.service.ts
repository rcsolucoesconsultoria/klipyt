import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ICnpjApi, CnpjBranchData } from '../../use-cases/establishment/ports/cnpj-api.port';

const MOCK_BRANCHES: Record<string, CnpjBranchData[]> = {
  '11222333': [
    { cnpj: '11222333000101', tradeName: 'Castelo Forte - Centro', addressText: 'Rua da Consolação, 2100 - Consolação, São Paulo, SP' },
    { cnpj: '11222333000202', tradeName: 'Castelo Forte - Jardins', addressText: 'Rua Oscar Freire, 900 - Jardins, São Paulo, SP' },
  ],
};

@Injectable()
export class CnpjApiService implements ICnpjApi {
  private readonly logger = new Logger(CnpjApiService.name);

  constructor(private readonly config: ConfigService) {}

  async fetchBranches(cnpjRoot: string): Promise<CnpjBranchData[]> {
    if (this.config.get('NODE_ENV') !== 'production' || !this.config.get('RECEITA_FEDERAL_API_KEY')) {
      this.logger.warn(`[mock] CNPJ branches para root: ${cnpjRoot}`);
      return MOCK_BRANCHES[cnpjRoot] ?? [
        { cnpj: `${cnpjRoot}0001`, tradeName: `Empresa ${cnpjRoot}`, addressText: 'Av. Paulista, 1000 - São Paulo, SP' },
      ];
    }

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjRoot}0001`);
    if (!res.ok) return [];
    const data: any = await res.json();
    return [{
      cnpj: data.cnpj?.replace(/\D/g, '') ?? cnpjRoot,
      tradeName: data.nome_fantasia || data.razao_social,
      addressText: `${data.logradouro}, ${data.numero} - ${data.municipio}, ${data.uf}`,
    }];
  }
}
