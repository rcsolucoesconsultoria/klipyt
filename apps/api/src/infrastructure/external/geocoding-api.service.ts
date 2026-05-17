import { Injectable, Logger } from '@nestjs/common';
import { IGeocodingApi } from '../../use-cases/establishment/ports/geocoding-api.port';

@Injectable()
export class GeocodingApiService implements IGeocodingApi {
  private readonly logger = new Logger(GeocodingApiService.name);

  async geocode(address: string): Promise<{ lat: number; lon: number } | null> {
    try {
      const encoded = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'KLIPYT/1.0 (contato@klipyt.com)' },
      });
      if (!res.ok) return null;
      const data: any[] = await res.json();
      if (!data.length) return null;
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (err) {
      this.logger.warn(`Geocoding falhou para: ${address} — ${err}`);
      return null;
    }
  }
}
