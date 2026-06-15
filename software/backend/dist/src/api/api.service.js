var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
let ApiService = class ApiService {
    create(createApiDto) {
        return 'This action adds a new api';
    }
    findAll() {
        return `This action returns all api`;
    }
    findOne(id) {
        return `This action returns a #${id} api`;
    }
    update(id, updateApiDto) {
        return `This action updates a #${id} api`;
    }
    remove(id) {
        return `This action removes a #${id} api`;
    }
};
ApiService = __decorate([
    Injectable()
], ApiService);
export { ApiService };
//# sourceMappingURL=api.service.js.map