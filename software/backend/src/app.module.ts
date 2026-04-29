import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';



@Module({
  imports:[
    ConfigModule.forRoot({isGlobal:true}),
    ThrottlerModule.forRoot({
      throttlers:[
       {
        ttl:60,
        limit:10,
        
       },
      ],
    }),
    PrismaModule

  ],
  providers:[
    {
      provide:APP_GUARD,
      useClass:ThrottlerGuard,
    },
  ],
})

export class AppModule{}