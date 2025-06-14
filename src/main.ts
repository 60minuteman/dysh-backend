import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Note: LoggingInterceptor is now configured as a global interceptor via APP_INTERCEPTOR in AppModule

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Dysh Backend API')
    .setDescription('AI-powered recipe generation platform with comprehensive user onboarding and authentication')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints (Apple/Google Sign-In)')
    .addTag('user', 'User onboarding and management endpoints')
    .addTag('recipes', 'Recipe generation endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your JWT access token',
        in: 'header',
      },
      'JWT-auth',
    );

  // Add servers based on environment
  if (process.env.NODE_ENV === 'production') {
    // Production server (Render will provide the URL)
    config.addServer('https://dysh-backend.onrender.com', 'Production server');
  } else {
    // Development server
    config.addServer('http://localhost:3000', 'Development server');
  }

  const document = SwaggerModule.createDocument(app, config.build());
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  // Enable CORS for frontend integration
  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces for Render
  
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation available at: http://localhost:${port}/api/docs`);
  console.log(`🔐 Authentication: Apple Sign-In (iOS) & Google Sign-In (Android)`);
  console.log(`🔍 Request/Response logging enabled for development mode`);
}
bootstrap();
