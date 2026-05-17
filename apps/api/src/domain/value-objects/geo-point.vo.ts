export class GeoPoint {
  constructor(
    public readonly latitude: number,
    public readonly longitude: number,
  ) {
    if (latitude < -90 || latitude > 90) throw new Error('Latitude inválida');
    if (longitude < -180 || longitude > 180) throw new Error('Longitude inválida');
  }

  toWkt(): string {
    return `SRID=4326;POINT(${this.longitude} ${this.latitude})`;
  }

  toGeoJson() {
    return { type: 'Point', coordinates: [this.longitude, this.latitude] };
  }

  distanceMetersTo(other: GeoPoint): number {
    const R = 6371000;
    const dLat = this.toRad(other.latitude - this.latitude);
    const dLon = this.toRad(other.longitude - this.longitude);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(this.latitude)) *
        Math.cos(this.toRad(other.latitude)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
