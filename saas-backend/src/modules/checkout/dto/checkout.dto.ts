import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateCheckoutDto {
  // Support both formats: direct checkout and order-based checkout
  
  // Direct checkout format
  @IsString()
  @IsOptional()
  merchantName?: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  amountIqd?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  // Order-based checkout format
  @IsArray()
  @IsOptional()
  items?: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;

  @IsOptional()
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  tax?: number;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ProcessPaymentDto {
  @IsString()
  sessionId: string;

  @IsString()
  token: string;

  @IsString()
  method: 'card' | 'wallet' | 'zaincash';

  @IsNumber()
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  card?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
    email: string;
  };

  @IsOptional()
  wallet?: {
    email: string;
    password: string;
  };

  @IsOptional()
  zaincash?: {
    phone: string;
  };
}
