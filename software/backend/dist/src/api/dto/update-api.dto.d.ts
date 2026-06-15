import { CreateApiDto } from './create-api.dto.js';
declare const UpdateApiDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateApiDto>>;
export declare class UpdateApiDto extends UpdateApiDto_base {
    email: String;
    password: string;
}
export {};
