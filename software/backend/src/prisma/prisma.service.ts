import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

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

  /**
   * Register an admin user if it doesn't exist
   * Uses environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
   */
  async registerAdmin() {
    try {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      const adminName = process.env.ADMIN_NAME || 'Administrator';

      // Skip if admin credentials not provided
      if (!adminEmail || !adminPassword) {
        console.log('Admin registration skipped: ADMIN_EMAIL or ADMIN_PASSWORD not provided');
        return;
      }

      // Check if admin already exists
      const existingAdmin = await (this as any).user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        console.log(`Admin user ${adminEmail} already exists`);
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      const admin = await (this as any).user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'ADMIN',
        },
      });

      console.log(`Admin user created successfully: ${admin.email}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error registering admin user:', error.message);
      } else {
        console.error('Error registering admin user:', error);
      }
    }
  }
}