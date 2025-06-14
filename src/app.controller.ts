import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Root route now handled by AdminController (Pegasus)
  // This controller moved to /app prefix to avoid conflicts
}
