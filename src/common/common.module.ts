import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { GeminiService } from './services/gemini.service';
import { EmailTemplatesService } from './services/email-templates.service';

@Module({
  providers: [
    CloudinaryService,
    GeminiService,
    EmailTemplatesService,
  ],
  exports: [
    CloudinaryService,
    GeminiService,
    EmailTemplatesService,
  ],
})
export class CommonModule {} 