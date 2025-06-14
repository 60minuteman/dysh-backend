import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [PrismaModule, AuthModule, JwtModule, RecipesModule],
  controllers: [AdminController],
  providers: [AdminService, LoggingInterceptor],
  exports: [AdminService],
})
export class AdminModule {} 