import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class EmitCoinsDto {
  @IsUUID()
  establishment_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @Min(1)
  budget_gross: number;

  @IsString()
  @IsNotEmpty()
  video_url: string;

  @IsString()
  start_time: string;

  @IsString()
  end_time: string;

  @IsOptional()
  @IsNumber()
  age_restriction?: number;
}
