import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectApiKeyRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}
