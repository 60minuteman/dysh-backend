import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');
    } catch (error) {
      this.logger.error('Failed to connect to database:', error.message);
      this.logger.warn('App will continue without database connection. Please check your database setup.');
      // Don't throw the error to allow the app to start
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      this.logger.error('Error disconnecting from database:', error.message);
    }
  }

  // Override methods to handle connection errors gracefully
  async $connect() {
    try {
      return await super.$connect();
    } catch (error) {
      this.logger.error('Database connection failed:', error.message);
      throw error;
    }
  }
} 