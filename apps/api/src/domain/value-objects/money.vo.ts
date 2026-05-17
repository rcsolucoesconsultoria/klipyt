export class Money {
  private readonly cents: number;

  constructor(value: number) {
    if (value < 0) throw new Error('Valor monetário não pode ser negativo');
    this.cents = Math.round(value * 100);
  }

  static fromCents(cents: number): Money {
    const m = Object.create(Money.prototype) as Money;
    (m as any).cents = cents;
    return m;
  }

  toNumber(): number {
    return this.cents / 100;
  }

  add(other: Money): Money {
    return Money.fromCents(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    if (other.cents > this.cents) throw new Error('Saldo insuficiente');
    return Money.fromCents(this.cents - other.cents);
  }

  multiply(factor: number): Money {
    return Money.fromCents(Math.round(this.cents * factor));
  }

  isGreaterOrEqualTo(other: Money): boolean {
    return this.cents >= other.cents;
  }

  toString(): string {
    return `R$ ${this.toNumber().toFixed(2)}`;
  }
}
