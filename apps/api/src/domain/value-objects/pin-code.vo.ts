export class PinCode {
  private readonly value: string;

  constructor(pin: string) {
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN deve ter exatamente 4 dígitos');
    this.value = pin;
  }

  static generate(): PinCode {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    return new PinCode(pin);
  }

  toString(): string {
    return this.value;
  }

  equals(other: PinCode): boolean {
    return this.value === other.value;
  }
}
