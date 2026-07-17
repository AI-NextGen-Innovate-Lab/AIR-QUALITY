import { IsEnum, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { SensorVisibility } from '../../../generated/prisma/client.js';

export class CreateSensorDto {
  @IsString()
  @MinLength(1)
  topic!: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsEnum(SensorVisibility)
  visibility?: SensorVisibility;

  @IsOptional()
  @IsNumber()
  ownerId?: number;
}
