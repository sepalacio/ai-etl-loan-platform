import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateApplicationDto {
  @IsEmail()
  @MaxLength(254)
  borrowerEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  borrowerName!: string;

  @IsNumber()
  @Min(1)
  @Max(100_000_000)
  requestedAmount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
