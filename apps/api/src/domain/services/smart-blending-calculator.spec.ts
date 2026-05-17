import { SmartBlendingCalculatorService } from './smart-blending-calculator.service';
import { Money } from '../value-objects/money.vo';

describe('SmartBlendingCalculatorService', () => {
  const service = new SmartBlendingCalculatorService();

  it('deve reter 40% na plataforma e gerar 120 moedas R$3 + 480 moedas R$0.50 (BRD UC05)', () => {
    const budgetGross = new Money(1000);
    const result = service.calculate(budgetGross, 0.4, 3.0, 0.5);

    expect(result.platformRevenue.toNumber()).toBe(400);
    expect(result.qualifiedPool.toNumber()).toBeCloseTo(360, 1);
    expect(result.volumePool.toNumber()).toBeCloseTo(240, 1);
    expect(result.qualifiedCoinCount).toBe(120);
    expect(result.volumeCoinCount).toBe(480);
  });

  it('budget_net = budget_gross * (1 - global_margin) (RN01)', () => {
    const result = service.calculate(new Money(500), 0.4);
    expect(result.platformRevenue.toNumber()).toBe(200);
  });
});
