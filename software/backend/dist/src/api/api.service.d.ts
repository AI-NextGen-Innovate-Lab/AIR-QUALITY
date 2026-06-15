import { CreateApiDto } from './dto/create-api.dto.js';
import { UpdateApiDto } from './dto/update-api.dto.js';
export declare class ApiService {
    create(createApiDto: CreateApiDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateApiDto: UpdateApiDto): string;
    remove(id: number): string;
}
