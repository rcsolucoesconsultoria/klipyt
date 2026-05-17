import { GeoPoint } from '../value-objects/geo-point.vo';

export const GEO_TOLERANCE_METERS = 25;

export class GeoValidatorService {
  isWithinRadius(
    submitted: GeoPoint,
    authoritative: GeoPoint,
    radiusMeters: number = GEO_TOLERANCE_METERS,
  ): boolean {
    const distance = submitted.distanceMetersTo(authoritative);
    return distance <= radiusMeters;
  }

  assertWithinRadius(submitted: GeoPoint, authoritative: GeoPoint): void {
    if (!this.isWithinRadius(submitted, authoritative)) {
      throw new Error(
        `Coordenada fora do raio permitido de ${GEO_TOLERANCE_METERS}m`,
      );
    }
  }
}
