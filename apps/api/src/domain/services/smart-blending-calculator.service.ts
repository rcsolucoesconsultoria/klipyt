import { Money } from '../value-objects/money.vo';

export interface BlendingResult {
  platformRevenue: Money;
  qualifiedPool: Money;
  volumePool: Money;
  qualifiedCoinValue: Money;
  qualifiedCoinCount: number;
  volumeCoinValue: Money;
  volumeCoinCount: number;
}

export class SmartBlendingCalculatorService {
  calculate(
    budgetGross: Money,
    globalMargin: number,
    qualifiedCoinValue = 3.0,
    volumeCoinValue = 0.5,
  ): BlendingResult {
    const platformRevenue = budgetGross.multiply(globalMargin);
    const budgetNet = budgetGross.multiply(1 - globalMargin);

    const qualifiedPool = budgetNet.multiply(0.6);
    const volumePool = budgetNet.multiply(0.4);

    const qualifiedCoinCount = Math.floor(qualifiedPool.toNumber() / qualifiedCoinValue);
    const volumeCoinCount = Math.floor(volumePool.toNumber() / volumeCoinValue);

    return {
      platformRevenue,
      qualifiedPool,
      volumePool,
      qualifiedCoinValue: new Money(qualifiedCoinValue),
      qualifiedCoinCount,
      volumeCoinValue: new Money(volumeCoinValue),
      volumeCoinCount,
    };
  }
}
