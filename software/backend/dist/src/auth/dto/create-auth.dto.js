var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength, } from "class-validator";
export class CreateAuthDto {
    name;
    email;
    password;
}
__decorate([
    Transform(({ value }) => value?.trim()),
    IsNotEmpty(),
    IsString(),
    MinLength(3),
    MaxLength(50),
    Matches(/^[a-zA-Z\s'-]+$/, {
        message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "name", void 0);
__decorate([
    Transform(({ value }) => value?.toLowerCase().trim()),
    IsNotEmpty(),
    IsEmail(),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "email", void 0);
__decorate([
    IsNotEmpty(),
    IsString(),
    MinLength(8, {
        message: "Password must be at least 8 characters",
    }),
    MaxLength(128),
    Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$/, {
        message: "Password must include uppercase, lowercase, number, and special character",
    }),
    __metadata("design:type", String)
], CreateAuthDto.prototype, "password", void 0);
//# sourceMappingURL=create-auth.dto.js.map