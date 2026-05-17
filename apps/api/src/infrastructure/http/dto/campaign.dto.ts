import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @IsUUID()
  establishment_id: string;

  @IsNumber()
  @IsPositive()
  budget_gross: number;

  @IsNotEmpty()
  video_url: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(99)
  age_restriction?: number;
}

export class ImportCnpjDto {
  @IsNotEmpty()
  @IsString()
  cnpj: string;

  @IsOptional()
  selected_cnpjs?: string[];
}

import { IsString } from 'class-validator';
