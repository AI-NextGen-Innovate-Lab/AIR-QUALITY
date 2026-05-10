var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiService } from './api.service.js';
import { CreateApiDto } from './dto/create-api.dto.js';
import { UpdateApiDto } from './dto/update-api.dto.js';
let ApiController = class ApiController {
    apiService;
    constructor(apiService) {
        this.apiService = apiService;
    }
    create(createApiDto) {
        return this.apiService.create(createApiDto);
    }
    findAll() {
        return this.apiService.findAll();
    }
    findOne(id) {
        return this.apiService.findOne(+id);
    }
    update(id, updateApiDto) {
        return this.apiService.update(+id, updateApiDto);
    }
    remove(id) {
        return this.apiService.remove(+id);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateApiDto]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "create", null);
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "findAll", null);
__decorate([
    Get(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "findOne", null);
__decorate([
    Patch(':id'),
    __param(0, Param('id')),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateApiDto]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "update", null);
__decorate([
    Delete(':id'),
    __param(0, Param('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "remove", null);
ApiController = __decorate([
    Controller('api'),
    __metadata("design:paramtypes", [ApiService])
], ApiController);
export { ApiController };
//# sourceMappingURL=api.controller.js.map