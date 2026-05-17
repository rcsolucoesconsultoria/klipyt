import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Cnpj } from '../../domain/value-objects/cnpj.vo';
import { TOKENS } from '../tokens';
import { IEstablishmentRepository } from '../campaign/ports/establishment-repository.port';
import { ICnpjApi } from './ports/cnpj-api.port';
import { IGeocodingApi } from './ports/geocoding-api.port';

export interface ImportCnpjInput {
  cnpjMatrix: string;
  selectedCnpjs?: string[];
}

export interface ImportCnpjResult {
  imported: number;
  skipped: number;
  branches: Array<{ cnpj: string; trade_name: string; lat: number; lon: number }>;
}

@Injectable()
export class ImportCnpjBranchesUseCase {
  constructor(
    @Inject(TOKENS.ESTABLISHMENT_REPOSITORY)
    private readonly establishments: IEstablishmentRepository,
    @Inject(TOKENS.CNPJ_API) private readonly cnpjApi: ICnpjApi,
    @Inject(TOKENS.GEOCODING_API) private readonly geocoding: IGeocodingApi,
  ) {}

  async execute(input: ImportCnpjInput): Promise<ImportCnpjResult> {
    let cnpjVo: Cnpj;
    try {
      cnpjVo = new Cnpj(input.cnpjMatrix);
    } catch {
      throw new BadRequestException('CNPJ inválido');
    }

    const cnpjRoot = cnpjVo.root();
    const branches = await this.cnpjApi.fetchBranches(cnpjRoot);

    const toProcess = input.selectedCnpjs?.length
      ? branches.filter((b) => input.selectedCnpjs!.includes(b.cnpj))
      : branches;

    let imported = 0;
    let skipped = 0;
    const result: ImportCnpjResult['branches'] = [];

    for (const branch of toProcess) {
      const existing = (await this.establishments.findByCnpjRoot(cnpjRoot)).find(
        (e) => e.cnpj === branch.cnpj,
      );
      if (existing) { skipped++; continue; }

      const coords = await this.geocoding.geocode(branch.addressText);
      if (!coords) { skipped++; continue; }

      await this.establishments.save({
        cnpj_root: cnpjRoot,
        cnpj: branch.cnpj,
        trade_name: branch.tradeName,
        address_text: branch.addressText,
        geom: `SRID=4326;POINT(${coords.lon} ${coords.lat})`,
        is_active: true,
      });

      imported++;
      result.push({ cnpj: branch.cnpj, trade_name: branch.tradeName, lat: coords.lat, lon: coords.lon });
    }

    return { imported, skipped, branches: result };
  }
}
