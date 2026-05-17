export class Cpf {
  private readonly value: string;

  constructor(raw: string) {
    const digits = raw.replace(/\D/g, '');
    if (!Cpf.isValid(digits)) {
      throw new Error(`CPF inválido: ${raw}`);
    }
    this.value = digits;
  }

  static isValid(digits: string): boolean {
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(digits[10]);
  }

  toString(): string {
    return this.value;
  }

  masked(): string {
    return `${this.value.slice(0, 3)}.***.***-${this.value.slice(9)}`;
  }
}
