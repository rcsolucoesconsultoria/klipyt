import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateListingDto {
  @IsUUID()
  coin_id: string;

  @IsNumber()
  @Min(0.01)
  list_price: number;
}

export class BuyOrderDto {
  @IsOptional()
  @IsIn(['wallet', 'pix'])
  payment_method?: 'wallet' | 'pix';
}
