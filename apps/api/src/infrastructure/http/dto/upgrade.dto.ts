import { IsNotEmpty, IsString } from 'class-validator';

export class UpgradeAccountDto {
  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsString()
  @IsNotEmpty()
  pix_key: string;
}
