var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
let PrismaService = class PrismaService extends PrismaClient {
    pool;
    constructor() {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL environment variable is not set');
        }
        const url = new URL(databaseUrl);
        const pool = new Pool({
            host: url.hostname || 'localhost',
            port: url.port ? parseInt(url.port, 10) : 5432,
            database: url.pathname?.slice(1) || '',
            user: url.username || 'postgres',
            password: decodeURIComponent(url.password),
        });
        const adapter = new PrismaPg(pool);
        super({ adapter });
        this.pool = pool;
    }
    async onModuleInit() {
        await this.$connect();
        await this.registerAdmin();
    }
    async onModuleDestroy() {
        await this.$disconnect();
        await this.pool.end();
    }
    async registerAdmin() {
        try {
            const adminEmail = process.env.ADMIN_EMAIL;
            const adminPassword = process.env.ADMIN_PASSWORD;
            const adminName = process.env.ADMIN_NAME || 'Administrator';
            if (!adminEmail || !adminPassword) {
                console.log('Admin registration skipped: ADMIN_EMAIL or ADMIN_PASSWORD not provided');
                return;
            }
            const existingAdmin = await this.user.findUnique({
                where: { email: adminEmail },
            });
            if (existingAdmin) {
                console.log(`Admin user ${adminEmail} already exists`);
                return;
            }
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = await this.user.create({
                data: {
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    role: 'ADMIN',
                },
            });
            console.log(`Admin user created successfully: ${admin.email}`);
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error registering admin user:', error.message);
            }
            else {
                console.error('Error registering admin user:', error);
            }
        }
    }
};
PrismaService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], PrismaService);
export { PrismaService };
//# sourceMappingURL=prisma.service.js.map