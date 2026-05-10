import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Security headers (helmet)
  app.use(helmet());

  app.setGlobalPrefix("api");

  //global validation pipe with detailed error messages
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors
          .map((error) => {
            const constraints = error.constraints
              ? Object.values(error.constraints).join(', ')
              : 'Validation failed';
            return `${error.property}: ${constraints}`;
          })
          .join('; ');

        return new BadRequestException({
          message: `Validation failed: ${messages}`,
          errors: errors.map((e) => ({
            field: e.property,
            errors: e.constraints || {},
          })),
        });
      },
    }),
  );

  //cors
  const allowedOrigins = split(process.env.ALLOWED_ORIGINS ?? 'https://localhost:5173');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend running on port ${process.env.PORT}`);
}
bootstrap();
function split(arg0: string): string[] {
  return arg0
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);
}

