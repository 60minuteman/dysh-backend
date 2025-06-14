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
import { AdminService } from '../../admin/admin.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private adminService: AdminService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();
      const { method, url, headers } = request;
      const userAgent = headers['user-agent'] || '';
      const startTime = Date.now();

      // Only log user-initiated app requests (exclude admin panel requests)
      const isAppRequest = this.isAppRequest(url);

      // Log request
      this.logger.log(`🔵 ${method} ${url}`);
      
      // Log query params if they exist
      if (Object.keys(request.query).length > 0) {
        this.logger.log(`📋 Query: ${JSON.stringify(request.query)}`);
      }
      
      // Log user agent
      this.logger.log(`🌐 User-Agent: ${userAgent}`);

      // Add request log to admin service (only for app requests)
      if (isAppRequest) {
        this.adminService.addLog({
          level: 'LOG',
          message: `${method} ${url}`,
          context: 'HTTP_REQUEST',
          method,
          url,
          userAgent,
        });
      }

      return next.handle().pipe(
        tap({
          next: (data) => {
            const responseTime = Date.now() - startTime;
            const statusCode = response.statusCode;
            
            // Log response
            this.logger.log(`🟢 ${method} ${url} - ${statusCode} - ${responseTime}ms`);
            
            // Log response data (truncated for readability)
            const responseData = typeof data === 'object' ? JSON.stringify(data) : String(data);
            const truncatedData = responseData.length > 500 ? 
              responseData.substring(0, 500) + '...' : responseData;
            this.logger.log(`📤 Response: ${truncatedData}`);
            this.logger.log('────────────────────────────────────────────────────────────────────────────────');

            // Add response log to admin service (only for app requests)
            if (isAppRequest) {
              this.adminService.addLog({
                level: 'LOG',
                message: `${method} ${url} - ${statusCode} - ${responseTime}ms`,
                context: 'HTTP_RESPONSE',
                method,
                url,
                statusCode,
                responseTime,
                userAgent,
              });
            }
          },
          error: (error) => {
            const responseTime = Date.now() - startTime;
            const statusCode = response.statusCode || 500;
            
            // Log error
            this.logger.error(`🔴 ${method} ${url} - ${statusCode} - ${responseTime}ms - ${error.message}`);
            this.logger.log('────────────────────────────────────────────────────────────────────────────────');

            // Add error log to admin service (only for app requests)
            if (isAppRequest) {
              this.adminService.addLog({
                level: 'ERROR',
                message: `${method} ${url} - ${statusCode} - ${responseTime}ms - ${error.message}`,
                context: 'HTTP_ERROR',
                method,
                url,
                statusCode,
                responseTime,
                userAgent,
              });
            }
          },
        }),
      );
    }

    return next.handle();
  }

  /**
   * Determines if a request is a user-initiated app request (not admin panel)
   */
  private isAppRequest(url: string): boolean {
    // Include only user-facing app endpoints
    const appEndpoints = [
      '/auth/',
      '/api/user/',
      '/api/explore/',
      '/api/cookbook',
      '/api/locations/',
      '/api/daily-recipes/',
      '/recipes/',
    ];

    // Exclude admin panel and internal endpoints
    const excludeEndpoints = [
      '/admin/',
      '/api/docs',
      '/favicon.ico',
      '/', // Root admin dashboard
    ];

    // Check if URL should be excluded
    for (const excludePattern of excludeEndpoints) {
      if (url.startsWith(excludePattern)) {
        return false;
      }
    }

    // Check if URL matches app endpoints
    for (const appPattern of appEndpoints) {
      if (url.startsWith(appPattern)) {
        return true;
      }
    }

    // Default to false for unknown endpoints
    return false;
  }
} 