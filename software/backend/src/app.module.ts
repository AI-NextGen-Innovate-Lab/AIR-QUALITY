import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { UsersModule } from "./users/users.module.js";
import { InfluxModule } from "./influx/influx.module.js";
import { ApiKeysModule } from "./api-keys/api-keys.module.js";
import { SensorsModule } from "./sensors/sensors.module.js";
import { AiModule } from "./ai/ai.module.js";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports:[
    ConfigModule.forRoot({isGlobal:true}),
    CacheModule.register({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers:[
       {
        ttl:60,
        limit:30,
        
       },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ApiKeysModule,
    SensorsModule,
    InfluxModule,
    AiModule,
  ],
  providers:[
    {
      provide:APP_GUARD,
      useClass:ThrottlerGuard,
    },
  ],
})

export class AppModule{}