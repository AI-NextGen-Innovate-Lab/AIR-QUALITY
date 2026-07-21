import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Security headers (helmet) — relax CSP so the Swagger UI assets can load
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.setGlobalPrefix("api");

  // OpenAPI / Swagger docs at GET /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Air Quality Monitoring API')
    .setDescription(
      'REST API for the Air Quality Monitoring System. Tiered access: ' +
        'public (no auth), authenticated (JWT Bearer), and programmatic (X-API-Key). ' +
        'Use the Authorize button to add a JWT or API key.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'ApiKey')
    .addTag('Auth', 'Registration, login, logout, token validation')
    .addTag('Readings', 'Air quality readings from InfluxDB (tiered access)')
    .addTag('Sensors', 'Sensor registry, map metadata, ownership & privacy')
    .addTag('API Keys', 'API key request lifecycle and key management')
    .addTag('Users', 'User management and audit logs (admin)')
    .addTag('Health', 'Service health checks')
    .addTag('AI', 'Predictions, forecasts, and AI-generated health recommendations')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

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

