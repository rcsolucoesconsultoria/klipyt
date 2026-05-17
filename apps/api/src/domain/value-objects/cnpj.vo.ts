export class Cnpj {
  private readonly value: string;

  constructor(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 14) {
      throw new Error(`CNPJ inválido: ${raw}`);
    }
    this.value = digits;
  }

  toString(): string {
    return this.value;
  }

  root(): string {
    return this.value.slice(0, 8);
  }
}
