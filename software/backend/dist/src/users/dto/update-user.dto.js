var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto.js";
import { IsEnum, IsOptional, IsString, IsEmail, MinLength, MaxLength, Matches } from "class-validator";
import { Transform } from "class-transformer";
export class UpdateUserDto extends PartialType(CreateUserDto) {
    name;
    email;
    password;
    role;
}
__decorate([
    IsOptional(),
    Transform(({ value }) => value?.trim()),
    IsString(),
    MinLength(3),
    MaxLength(50),
    Matches(/^[a-zA-Z\s'-]+$/, {
        message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => value?.toLowerCase().trim()),
    IsEmail(),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    MinLength(8),
    MaxLength(100),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
__decorate([
    IsOptional(),
    IsEnum(["USER", "ADMIN", "OWNER"]),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
//# sourceMappingURL=update-user.dto.js.map