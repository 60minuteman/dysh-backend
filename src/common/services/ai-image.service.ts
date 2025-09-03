import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiImageService {
  private readonly openaiApiKey: string;
  private readonly geminiApiKey: string;
  private readonly replicateApiKey: string;
  private readonly deepseekApiKey: string;

  constructor(private configService: ConfigService) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.replicateApiKey = this.configService.get<string>('REPLICATE_API_KEY');
    this.deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
  }

  /**
   * Generate AI image for a recipe using the best available service
   */
  async generateRecipeImage(recipeTitle: string, ingredients?: string[], cuisine?: string): Promise<string> {
    // Try different AI image generation services in order of preference
    const services = [
      () => this.generateWithGemini(recipeTitle, ingredients, cuisine),
      () => this.generateWithDeepSeek(recipeTitle, ingredients, cuisine),
      () => this.generateWithDallE(recipeTitle, ingredients, cuisine),
      () => this.generateWithReplicate(recipeTitle, ingredients, cuisine),
    ];

    for (const service of services) {
      try {
        const imageUrl = await service();
        if (imageUrl) {
          console.log(`✅ Generated AI image for "${recipeTitle}"`);
          return imageUrl;
        }
      } catch (error) {
        console.log(`❌ Image generation failed: ${error.message}`);
        continue;
      }
    }

    // Fallback to themed placeholder
    console.log(`⚠️ All AI image services failed, using themed placeholder for "${recipeTitle}"`);
    return this.createThemedPlaceholder(recipeTitle, cuisine);
  }

  /**
   * Generate image using DALL-E 3 (OpenAI)
   */
  private async generateWithDallE(recipeTitle: string, ingredients?: string[], cuisine?: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.createImagePrompt(recipeTitle, ingredients, cuisine);
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural',
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return response.data.data[0].url;
  }

  /**
   * Generate image using DeepSeek (via better prompt generation)
   */
  private async generateWithDeepSeek(recipeTitle: string, ingredients?: string[], cuisine?: string): Promise<string> {
    if (!this.deepseekApiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    try {
      // Use DeepSeek to generate a better image prompt
      const promptGenerationRequest = `Create a detailed, professional food photography prompt for this recipe: "${recipeTitle}". 
      
      Recipe details:
      - Cuisine: ${cuisine || 'International'}
      - Main ingredients: ${ingredients?.slice(0, 3).join(', ') || 'various ingredients'}
      
      Generate a detailed prompt that describes:
      1. The visual appearance of the dish
      2. Professional food photography style
      3. Lighting and composition
      4. Background and presentation
      
      Return ONLY the image prompt, nothing else.`;

      const deepSeekResponse = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: promptGenerationRequest
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      const enhancedPrompt = deepSeekResponse.data.choices[0].message.content;
      
      // Now use the enhanced prompt with Replicate/Stable Diffusion
      return await this.generateWithReplicate(recipeTitle, ingredients, cuisine, enhancedPrompt);
      
    } catch (error) {
      throw new Error(`DeepSeek prompt generation failed: ${error.message}`);
    }
  }

  /**
   * Generate image using Replicate (Stable Diffusion)
   */
  private async generateWithReplicate(recipeTitle: string, ingredients?: string[], cuisine?: string, enhancedPrompt?: string): Promise<string> {
    if (!this.replicateApiKey) {
      throw new Error('Replicate API key not configured');
    }

    const prompt = enhancedPrompt || this.createImagePrompt(recipeTitle, ingredients, cuisine);
    
    // Start the prediction
    const startResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // Stable Diffusion XL
        input: {
          prompt: prompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          scheduler: 'K_EULER',
          num_inference_steps: 20,
          guidance_scale: 7.5,
        },
      },
      {
        headers: {
          'Authorization': `Token ${this.replicateApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const predictionId = startResponse.data.id;
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      const statusResponse = await axios.get(
        `https://api.replicate.com/v1/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`,
          },
        }
      );

      const prediction = statusResponse.data;
      
      if (prediction.status === 'succeeded') {
        return prediction.output[0];
      } else if (prediction.status === 'failed') {
        throw new Error(`Replicate prediction failed: ${prediction.error}`);
      }
      
      attempts++;
    }

    throw new Error('Replicate prediction timed out');
  }

  /**
   * Generate image using Gemini (text-to-image via generateContent)
   */
  private async generateWithGemini(recipeTitle: string, ingredients?: string[], cuisine?: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = this.createImagePrompt(recipeTitle, ingredients, cuisine);
    
    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            responseModalities: ["TEXT", "IMAGE"]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout for image generation
        }
      );

      if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
        const content = response.data.candidates[0].content.parts[0].text;
        
        // Extract base64 image data if present
        const base64Match = content.match(/data:image\/[^;]+;base64,([^"]+)/);
        if (base64Match) {
          return base64Match[0];
        }
        
        // If no base64 image, return the text content as fallback
        return content;
      } else {
        throw new Error('No image content received from Gemini');
      }
    } catch (error) {
      if (error.response) {
        throw new Error(`Gemini API error: ${error.response.data?.error?.message || error.message}`);
      }
      throw new Error(`Gemini image generation failed: ${error.message}`);
    }
  }

  /**
   * Create optimized prompt for image generation
   */
  private createImagePrompt(recipeTitle: string, ingredients?: string[], cuisine?: string): string {
    const basePrompt = `Professional food photography of ${recipeTitle}`;
    
    let prompt = basePrompt;
    
    // Add cuisine context
    if (cuisine && cuisine !== 'International') {
      prompt += `, ${cuisine} cuisine style`;
    }
    
    // Add ingredient context
    if (ingredients && ingredients.length > 0) {
      const mainIngredients = ingredients.slice(0, 3).join(', ');
      prompt += `, featuring ${mainIngredients}`;
    }
    
    // Add photography style
    prompt += ', beautifully plated, professional food photography, high quality, appetizing, well-lit, restaurant quality, food styling, clean background, 8k resolution';
    
    return prompt;
  }

  /**
   * Create themed placeholder as fallback
   */
  private createThemedPlaceholder(recipeTitle: string, cuisine?: string): string {
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
      'italian': 'e74c3c',
      'mexican': 'f39c12',
      'indian': 'e67e22',
      'chinese': 'c0392b',
      'breakfast': 'f9ca24',
      'protein': 'eb4d4b',
      'carb': '45b7d1',
      'default': 'f0932b'
    };

    let color = colors.default;
    const lowerTitle = recipeTitle.toLowerCase();
    const lowerCuisine = cuisine?.toLowerCase() || '';
    
    for (const [key, value] of Object.entries(colors)) {
      if (lowerTitle.includes(key) || lowerCuisine.includes(key)) {
        color = value;
        break;
      }
    }

    // Get first 2-3 words for clean display
    const displayText = recipeTitle.split(' ').slice(0, 3).join(' ');
    const encodedText = encodeURIComponent(`${emoji} ${displayText}`);
    
    return `https://dummyimage.com/400x400/${color}/ffffff&text=${encodedText}`;
  }

  /**
   * Generate multiple images for batch processing
   */
  async generateBatchImages(recipes: Array<{title: string, ingredients?: string[], cuisine?: string}>): Promise<Array<{title: string, imageUrl: string}>> {
    const results = [];
    
    for (const recipe of recipes) {
      try {
        const imageUrl = await this.generateRecipeImage(recipe.title, recipe.ingredients, recipe.cuisine);
        results.push({
          title: recipe.title,
          imageUrl
        });
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Failed to generate image for ${recipe.title}:`, error.message);
        results.push({
          title: recipe.title,
          imageUrl: this.createThemedPlaceholder(recipe.title, recipe.cuisine)
        });
      }
    }
    
    return results;
  }
}
