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
import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { InfluxService } from './influx.service.js';
import { TieredAccessGuard } from '../access/tiered-access.guard.js';
import { clampReadingsQuery } from '../access/tiered-access.types.js';
let InfluxController = class InfluxController {
    influxService;
    constructor(influxService) {
        this.influxService = influxService;
    }
    async fetchData(limit, page, hours, sensorId, sensor, measurement, req) {
        const tier = req?.accessTier ?? 'PUBLIC';
        const clamped = clampReadingsQuery({ limit, page, hours, sensorId: sensorId ?? sensor, measurement }, tier);
        return this.influxService.getReadings(clamped, tier);
    }
    getHealth() {
        return this.influxService.getHealth();
    }
};
__decorate([
    Get('readings'),
    UseGuards(TieredAccessGuard),
    __param(0, Query('limit')),
    __param(1, Query('page')),
    __param(2, Query('hours')),
    __param(3, Query('sensorId')),
    __param(4, Query('sensor')),
    __param(5, Query('measurement')),
    __param(6, Request()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], InfluxController.prototype, "fetchData", null);
__decorate([
    Get('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InfluxController.prototype, "getHealth", null);
InfluxController = __decorate([
    Controller(),
    __metadata("design:paramtypes", [InfluxService])
], InfluxController);
export { InfluxController };
//# sourceMappingURL=influx.controller.js.map