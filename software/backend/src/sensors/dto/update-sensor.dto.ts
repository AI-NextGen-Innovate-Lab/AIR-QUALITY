import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { SensorVisibility } from '../../../generated/prisma/client.js';

export class UpdateSensorDto {
  @IsOptional()
  @IsString()
  topic?: string;

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
  ownerId?: number | null;
}
