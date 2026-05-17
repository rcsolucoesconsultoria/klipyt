import { GeoValidatorService } from './geo-validator.service';
import { GeoPoint } from '../value-objects/geo-point.vo';

describe('GeoValidatorService (RN04)', () => {
  const service = new GeoValidatorService();

  const coin = new GeoPoint(-23.55052, -46.63331);

  it('aceita coordenada dentro de 25m', () => {
    const user = new GeoPoint(-23.55042, -46.63321);
    expect(service.isWithinRadius(user, coin)).toBe(true);
  });

  it('rejeita coordenada a 300m (Fake GPS)', () => {
    const fake = new GeoPoint(-23.5532, -46.6333);
    expect(service.isWithinRadius(fake, coin)).toBe(false);
  });

  it('assertWithinRadius lança erro quando fora do raio', () => {
    const fake = new GeoPoint(-23.5532, -46.6333);
    expect(() => service.assertWithinRadius(fake, coin)).toThrow();
  });
});
