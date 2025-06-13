import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { GeminiService } from './services/gemini.service';

@Module({
  providers: [CloudinaryService, GeminiService],
  exports: [CloudinaryService, GeminiService],
})
export class CommonModule {} 