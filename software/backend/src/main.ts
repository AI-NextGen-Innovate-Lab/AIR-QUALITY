import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Security headers (helmet)
  app.use(helmet());

  app.setGlobalPrefix("api");


  //global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
      transform:true,
      transformOptions:{
        enableImplicitConversion:true,
      },
    }),
  );

  //cors
  const allowedOrigins = split(process.env.ALLOWED_ORIGINS ?? 'https://localhost:5173');

  
  app.enableCors({
    origin:allowedOrigins,
    credentials:true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on port ${process.env.PORT}`)
  
}
bootstrap();
function split(arg0: string): string[] {
  return arg0
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

