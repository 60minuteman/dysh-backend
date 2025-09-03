import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { GeminiService } from './services/gemini.service';
import { EmailTemplatesService } from './services/email-templates.service';
import { AiImageService } from './services/ai-image.service';

@Module({
  providers: [
    CloudinaryService,
    GeminiService,
    EmailTemplatesService,
    AiImageService,
  ],
  exports: [
    CloudinaryService,
    GeminiService,
    EmailTemplatesService,
    AiImageService,
  ],
})
export class CommonModule {} 