import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemCouponDto {
  @IsString()
  @IsNotEmpty()
  qr_token: string;

  @IsString()
  @IsNotEmpty()
  establishment_id: string;
}
