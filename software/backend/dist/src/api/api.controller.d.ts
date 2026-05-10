import { ApiService } from './api.service.js';
import { CreateApiDto } from './dto/create-api.dto.js';
import { UpdateApiDto } from './dto/update-api.dto.js';
export declare class ApiController {
    private readonly apiService;
    constructor(apiService: ApiService);
    create(createApiDto: CreateApiDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateApiDto: UpdateApiDto): string;
    remove(id: string): string;
}
