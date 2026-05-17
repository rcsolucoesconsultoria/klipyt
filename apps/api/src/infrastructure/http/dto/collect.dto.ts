import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class CollectCoinDto {
  @IsUUID()
  coin_id: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;

  @IsNumber()
  timestamp_ms: number;

  @IsString()
  @IsNotEmpty()
  hmac: string;
}

export class VideoWatchedDto {
  @IsUUID()
  coin_id: string;
}
