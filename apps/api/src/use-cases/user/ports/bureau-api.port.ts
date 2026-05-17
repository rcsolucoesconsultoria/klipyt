export interface BureauApiResult {
  fullName: string;
  birthDate: Date;
}

export interface IBureauApi {
  lookupCpf(cpf: string): Promise<BureauApiResult>;
}
