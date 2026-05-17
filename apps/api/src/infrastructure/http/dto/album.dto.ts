import { IsNotEmpty, IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class OpenPackDto {
  @IsUUID()
  @IsNotEmpty()
  pack_id: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}

export class GeneratePinDto {
  @IsUUID()
  @IsNotEmpty()
  sticker_id: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}

export class ConfirmPinDto {
  @IsString()
  @IsNotEmpty()
  pin: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon: number;
}
