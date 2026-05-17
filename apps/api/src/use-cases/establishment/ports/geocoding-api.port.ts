export interface IGeocodingApi {
  geocode(address: string): Promise<{ lat: number; lon: number } | null>;
}
