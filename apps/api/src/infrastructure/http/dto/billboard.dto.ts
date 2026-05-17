import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class RentBillboardDto {
  @IsUUID()
  billboard_id: string;

  @IsString()
  @IsNotEmpty()
  merchant_cnpj_root: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsString()
  creative_video_url?: string;
}

export class InteractBillboardDto {
  @IsUUID()
  billboard_id: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;
}
