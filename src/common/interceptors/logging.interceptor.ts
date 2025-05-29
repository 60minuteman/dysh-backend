import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only log in development mode
    if (process.env.NODE_ENV !== 'development') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    const { method, url, headers, body, query } = request;
    const userAgent = headers['user-agent'] || '';

    // Log incoming request
    this.logger.log(`🔵 ${method} ${url}`);
    
    if (Object.keys(query).length > 0) {
      this.logger.log(`📋 Query: ${JSON.stringify(query)}`);
    }
    
    if (body && Object.keys(body).length > 0) {
      this.logger.log(`📦 Body: ${JSON.stringify(body, null, 2)}`);
    }
    
    this.logger.log(`🌐 User-Agent: ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;
          
          // Log response
          this.logger.log(`🟢 ${method} ${url} - ${statusCode} - ${duration}ms`);
          
          if (responseBody) {
            // Truncate long responses for readability
            const bodyStr = JSON.stringify(responseBody, null, 2);
            const truncatedBody = bodyStr.length > 500 
              ? bodyStr.substring(0, 500) + '\n... (truncated)'
              : bodyStr;
            this.logger.log(`📤 Response: ${truncatedBody}`);
          }
          
          this.logger.log('─'.repeat(80));
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(`🔴 ${method} ${url} - ERROR - ${duration}ms`);
          this.logger.error(`❌ Error: ${error.message}`);
          this.logger.log('─'.repeat(80));
        },
      }),
    );
  }
} 