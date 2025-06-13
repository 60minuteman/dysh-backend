import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private cloudinaryConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.cloudinaryConfigured = true;
    } else {
      console.log('Cloudinary not configured - using themed placeholders for images');
    }
  }

  async generateRecipeImage(recipeTitle: string): Promise<string> {
    // Generate themed placeholder based on recipe content
    const themedPlaceholderUrl = this.createThemedPlaceholder(recipeTitle);
    console.log(`✅ Generated themed image for "${recipeTitle}": ${themedPlaceholderUrl}`);
    return themedPlaceholderUrl;
  }

  private createThemedPlaceholder(recipeTitle: string): string {
    // Create a food-themed placeholder with better styling
    const foodEmojis = {
      'breakfast': '🍳',
      'egg': '🥚',
      'chicken': '🍗',
      'beef': '🥩',
      'fish': '🐟',
      'salmon': '🐟',
      'salad': '🥗',
      'soup': '🍲',
      'pasta': '🍝',
      'rice': '🍚',
      'bread': '🍞',
      'oats': '🥣',
      'quinoa': '🌾',
      'avocado': '🥑',
      'default': '🍽️'
    };

    // Find matching emoji
    const words = recipeTitle.toLowerCase();
    let emoji = foodEmojis.default;
    for (const [key, value] of Object.entries(foodEmojis)) {
      if (words.includes(key)) {
        emoji = value;
        break;
      }
    }

    // Color scheme based on cuisine or food type
    const colors = {
      'nigerian': 'ff6b6b',
      'mediterranean': '4ecdc4', 
      'japanese': '6c5ce7',
      'breakfast': 'f9ca24',
      'protein': 'eb4d4b',
      'carb': '45b7d1',
      'default': 'f0932b'
    };

    let color = colors.default;
    const lowerTitle = recipeTitle.toLowerCase();
    for (const [key, value] of Object.entries(colors)) {
      if (lowerTitle.includes(key)) {
        color = value;
        break;
      }
    }

    // Get first 2-3 words for clean display
    const displayText = recipeTitle.split(' ').slice(0, 3).join(' ');
    const encodedText = encodeURIComponent(`${emoji} ${displayText}`);
    
    return `https://dummyimage.com/400x400/${color}/ffffff&text=${encodedText}`;
  }

  async uploadImage(imageBuffer: Buffer, fileName: string): Promise<string> {
    if (!this.cloudinaryConfigured) {
      throw new Error('Cloudinary not configured for image uploads');
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: `recipes/${fileName}`,
          format: 'jpg',
          transformation: [
            { width: 400, height: 400, crop: 'fill' },
            { quality: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result.secure_url);
          }
        },
      ).end(imageBuffer);
    });
  }

  async uploadImageFromUrl(imageUrl: string, fileName: string): Promise<string> {
    if (!this.cloudinaryConfigured) {
      throw new Error('Cloudinary not configured for image uploads');
    }

    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        public_id: `recipes/${fileName}`,
        format: 'jpg',
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto' },
        ],
      });
      return result.secure_url;
    } catch (error) {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.cloudinaryConfigured) {
      console.log('Cloudinary not configured - cannot delete image');
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete image from Cloudinary:', error);
    }
  }
} 