import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto.js";
import { IsEnum, IsOptional, IsString, IsEmail, MinLength, MaxLength, Matches } from "class-validator";
import { Transform } from "class-transformer";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z\s'-]+$/, {
    message: "Name can only contain letters, spaces, hyphens, and apostrophes",
  })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
    message:
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  })
  password?: string;

  @IsOptional()
  @IsEnum(["USER", "ADMIN", "OWNER"])
  role?: string;
}
