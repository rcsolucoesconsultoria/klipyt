export interface CnpjBranchData {
  cnpj: string;
  tradeName: string;
  addressText: string;
}

export interface ICnpjApi {
  fetchBranches(cnpjRoot: string): Promise<CnpjBranchData[]>;
}
