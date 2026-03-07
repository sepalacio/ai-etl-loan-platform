import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateApplicationDto {
  @IsEmail()
  borrowerEmail!: string;

  @IsString()
  @IsNotEmpty()
  borrowerName!: string;

  @IsNumber()
  @Min(1)
  requestedAmount!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
