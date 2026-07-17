import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateApiKeyRequestDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  purpose: string;
}
