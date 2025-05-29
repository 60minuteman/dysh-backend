import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
import { RecipeResponseDto, MealDto } from './dto/recipe-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class RecipesService {
  private readonly geminiApiKey: string;
  private readonly deepseekApiKey: string;
  private readonly geminiEndpoint: string;
  private readonly geminiImageEndpoint: string;
  private readonly deepseekEndpoint: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.deepseekApiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    
    if (!this.geminiApiKey && !this.deepseekApiKey) {
      throw new Error('Either GEMINI_API_KEY or DEEPSEEK_API_KEY must be defined in environment variables');
    }
    
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.geminiImageEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent';
    this.deepseekEndpoint = 'https://api.deepseek.com/chat/completions';
  }

  async generatePersonalizedRecipe(generateRecipeDto: GenerateRecipeDto, userId: string): Promise<RecipeResponseDto> {
    const { ingredients, country } = generateRecipeDto;

    // Fetch user profile with preferences and location
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Determine location for cuisine style
    const cuisineLocation = country || user.profile?.location?.country || 'International';

    // Build enhanced prompt for multiple structured meals
    const prompt = this.buildStructuredMealsPrompt(ingredients, user.profile, cuisineLocation);

    // Try Gemini first if API key is available
    if (this.geminiApiKey) {
      try {
        console.log(`🤖 Attempting personalized recipe generation with Gemini for ${cuisineLocation} cuisine...`);
        const aiResponse = await this.generateWithGemini(prompt);
        console.log('✅ Gemini generation successful');
        
        const meals = this.parseAIResponse(aiResponse);
        
        // Generate images for each meal
        console.log('🎨 Generating images for each meal...');
        const mealsWithImages = await this.generateImagesForMeals(meals);
        console.log('✅ Image generation completed');
        
        return {
          meals: mealsWithImages,
          location: cuisineLocation,
          provider: 'gemini'
        };
      } catch (error) {
        console.log('❌ Gemini failed, trying DeepSeek fallback...');
        if (axios.isAxiosError(error)) {
          console.log(`Gemini error: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }

    // Fallback to DeepSeek if Gemini fails or is not available
    if (this.deepseekApiKey) {
      try {
        console.log(`🧠 Attempting personalized recipe generation with DeepSeek for ${cuisineLocation} cuisine...`);
        const aiResponse = await this.generateWithDeepSeek(prompt);
        console.log('✅ DeepSeek generation successful');
        
        const meals = this.parseAIResponse(aiResponse);
        
        // For DeepSeek, we still use Gemini for image generation if available
        if (this.geminiApiKey) {
          console.log('🎨 Generating images for each meal with Gemini...');
          const mealsWithImages = await this.generateImagesForMeals(meals);
          console.log('✅ Image generation completed');
          return {
            meals: mealsWithImages,
            location: cuisineLocation,
            provider: 'deepseek'
          };
        } else {
          // No image generation available
          const mealsWithPlaceholders = meals.map(meal => ({
            ...meal,
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+'
          }));
          
          return {
            meals: mealsWithPlaceholders,
            location: cuisineLocation,
            provider: 'deepseek'
          };
        }
      } catch (error) {
        console.log('❌ DeepSeek also failed');
        if (axios.isAxiosError(error)) {
          throw new HttpException(
            `Both AI providers failed. DeepSeek error: ${error.response?.data?.error?.message || error.message}`,
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
        throw error;
      }
    }

    throw new HttpException(
      'No AI provider available. Please configure GEMINI_API_KEY or DEEPSEEK_API_KEY',
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  private buildStructuredMealsPrompt(ingredients: string[], profile: any, location: string): string {
    const cuisineStyle = this.getCuisineStyle(location);
    
    let prompt = `You are a professional chef specializing in ${cuisineStyle} cuisine. Create exactly 3 different ${cuisineStyle} meals using these ingredients: ${ingredients.join(', ')}.`;
    
    // Add dietary preferences
    if (profile?.dietaryPreference && profile.dietaryPreference !== 'NONE') {
      const dietaryMap = {
        VEGETARIAN: 'vegetarian (no meat)',
        VEGAN: 'vegan (no animal products)',
        PESCATARIAN: 'pescatarian (fish allowed, no other meat)',
        GLUTEN_FREE: 'gluten-free',
        KETO: 'ketogenic (low-carb, high-fat)',
      };
      prompt += ` ALL recipes must be ${dietaryMap[profile.dietaryPreference] || profile.dietaryPreference.toLowerCase()}.`;
    }

    // Add serving size preference
    const servings = profile?.preferredServings || 4;
    prompt += ` Each recipe should serve ${servings} people.`;

    prompt += `

CRITICAL: Respond ONLY with valid JSON in this exact format (no additional text, no markdown, no explanations):

{
  "meals": [
    {
      "name": "Proper Meal Name",
      "estimatedCookTime": "X minutes",
      "calories": "XXX calories per serving",
      "rating": 4.5,
      "ingredients": [
        "specific amount + ingredient (e.g., 400g pasta)",
        "specific amount + ingredient (e.g., 2 cups cream)"
      ],
      "instructions": [
        "Step 1: detailed instruction",
        "Step 2: detailed instruction",
        "Step 3: detailed instruction"
      ],
      "proTips": [
        "Professional cooking tip 1",
        "Professional cooking tip 2"
      ]
    }
  ]
}

Requirements:
1. Create exactly 3 different meals in the meals array
2. Each meal must be distinctly different from the others
3. Use ${cuisineStyle} cooking styles and techniques
4. Include specific measurements in ingredients
5. Rating should be realistic (3.5-5.0 range)
6. Each meal should have 5-8 ingredients, 4-8 instructions, 2-4 pro tips
7. Estimated cook time should be realistic (15-60 minutes)
8. Calories should be reasonable (300-800 per serving)`;

    // Add dietary-specific instructions
    if (profile?.dietaryPreference) {
      switch (profile.dietaryPreference) {
        case 'VEGETARIAN':
          prompt += `\n\nIMPORTANT: No meat, poultry, or fish. Use plant-based proteins.`;
          break;
        case 'VEGAN':
          prompt += `\n\nIMPORTANT: No animal products (meat, dairy, eggs, honey). Use only plant-based ingredients.`;
          break;
        case 'PESCATARIAN':
          prompt += `\n\nIMPORTANT: Fish and seafood allowed, but no other meat (beef, pork, chicken).`;
          break;
        case 'GLUTEN_FREE':
          prompt += `\n\nIMPORTANT: All ingredients must be gluten-free. Use alternatives to wheat products.`;
          break;
        case 'KETO':
          prompt += `\n\nIMPORTANT: Very low carbs (under 20g total). Focus on high-fat, moderate protein.`;
          break;
      }
    }

    return prompt;
  }

  private getCuisineStyle(location: string): string {
    const cuisineMap: { [key: string]: string } = {
      'Italy': 'Italian',
      'Japan': 'Japanese',
      'China': 'Chinese',
      'India': 'Indian',
      'Mexico': 'Mexican',
      'France': 'French',
      'Thailand': 'Thai',
      'Greece': 'Greek',
      'Spain': 'Spanish',
      'United States': 'American',
      'Korea': 'Korean',
      'Vietnam': 'Vietnamese',
      'Turkey': 'Turkish',
      'Morocco': 'Moroccan',
      'Germany': 'German',
      'United Kingdom': 'British',
      'Brazil': 'Brazilian',
      'Argentina': 'Argentinian',
      'Lebanon': 'Lebanese',
      'Peru': 'Peruvian',
    };

    return cuisineMap[location] || 'International';
  }

  private parseAIResponse(aiResponse: string): MealDto[] {
    try {
      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      
      // Find JSON object in the response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        throw new Error('No valid JSON found in AI response');
      }
      
      const jsonStr = cleanResponse.slice(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.meals || !Array.isArray(parsed.meals)) {
        throw new Error('Invalid response format: meals array not found');
      }
      
      // Validate and sanitize each meal
      const validatedMeals: MealDto[] = parsed.meals.slice(0, 3).map((meal: any, index: number) => {
        return {
          name: meal.name || `Meal ${index + 1}`,
          estimatedCookTime: meal.estimatedCookTime || '30 minutes',
          calories: meal.calories || '400 calories per serving',
          rating: typeof meal.rating === 'number' ? Math.max(3.5, Math.min(5.0, meal.rating)) : 4.0,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : ['Ingredients not properly formatted'],
          instructions: Array.isArray(meal.instructions) ? meal.instructions : ['Instructions not properly formatted'],
          proTips: Array.isArray(meal.proTips) ? meal.proTips : ['Pro tips not available'],
          image: '', // Will be populated by image generation
        };
      });
      
      // Ensure we have at least 1 meal
      if (validatedMeals.length === 0) {
        throw new Error('No valid meals found in response');
      }
      
      return validatedMeals;
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Raw response:', aiResponse);
      
      // Fallback: create a single meal from the raw response
      return [{
        name: 'Custom Recipe',
        estimatedCookTime: '30 minutes',
        calories: '400 calories per serving',
        rating: 4.0,
        ingredients: ['Check the raw recipe content for ingredients'],
        instructions: ['See raw recipe content for detailed instructions'],
        proTips: ['Recipe generated but could not be properly structured'],
        image: '', // Will be populated by image generation
      }];
    }
  }

  // Keep the original method for backward compatibility
  async generateRecipe(generateRecipeDto: GenerateRecipeDto) {
    const { ingredients } = generateRecipeDto;

    const prompt = `Create a detailed recipe using these ingredients: ${ingredients.join(', ')}. 
    Include:
    1. Recipe name
    2. Preparation time
    3. Cooking time
    4. Difficulty level
    5. Detailed instructions
    6. Additional ingredients needed (if any)
    7. Nutritional information (approximate)`;

    // Try Gemini first if API key is available
    if (this.geminiApiKey) {
      try {
        console.log('🤖 Attempting recipe generation with Gemini...');
        const recipe = await this.generateWithGemini(prompt);
        console.log('✅ Gemini generation successful');
        return { recipe, provider: 'gemini' };
      } catch (error) {
        console.log('❌ Gemini failed, trying DeepSeek fallback...');
        if (axios.isAxiosError(error)) {
          console.log(`Gemini error: ${error.response?.data?.error?.message || error.message}`);
        }
      }
    }

    // Fallback to DeepSeek if Gemini fails or is not available
    if (this.deepseekApiKey) {
      try {
        console.log('🧠 Attempting recipe generation with DeepSeek...');
        const recipe = await this.generateWithDeepSeek(prompt);
        console.log('✅ DeepSeek generation successful');
        return { recipe, provider: 'deepseek' };
      } catch (error) {
        console.log('❌ DeepSeek also failed');
        if (axios.isAxiosError(error)) {
          throw new HttpException(
            `Both AI providers failed. DeepSeek error: ${error.response?.data?.error?.message || error.message}`,
            error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
        throw error;
      }
    }

    throw new HttpException(
      'No AI provider available. Please configure GEMINI_API_KEY or DEEPSEEK_API_KEY',
      HttpStatus.SERVICE_UNAVAILABLE
    );
  }

  private async generateWithGemini(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.geminiEndpoint}?key=${this.geminiApiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  }

  private async generateWithDeepSeek(prompt: string): Promise<string> {
    const response = await axios.post(
      this.deepseekEndpoint,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional chef and recipe expert. Always respond with valid JSON format when requested. Create detailed, practical recipes with clear instructions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: false,
        temperature: 0.7,
        max_tokens: 3000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.deepseekApiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  private async generateImagesForMeals(meals: MealDto[]): Promise<MealDto[]> {
    const mealsWithImages: MealDto[] = [];
    
    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      console.log(`🎨 Generating image ${i + 1}/3 for: ${meal.name}`);
      
      try {
        const imageBase64 = await this.generateMealImage(meal.name);
        mealsWithImages.push({
          ...meal,
          image: imageBase64
        });
        console.log(`✅ Image ${i + 1}/3 generated successfully`);
      } catch (error) {
        console.log(`❌ Image ${i + 1}/3 generation failed, using placeholder`);
        console.error('Image generation error:', error.message);
        
        // Use placeholder image if generation fails
        mealsWithImages.push({
          ...meal,
          image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+'
        });
      }
    }
    
    return mealsWithImages;
  }

  private async generateMealImage(mealName: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key required for image generation');
    }

    const imagePrompt = `Create a high-quality, professional food photography image of "${mealName}". 
    The image should be:
    - Beautifully plated and garnished
    - Well-lit with natural lighting
    - Shot from a top-down or 45-degree angle
    - Restaurant-quality presentation
    - Vibrant colors and appetizing appearance
    - Clean, minimal background
    - Focus on the dish with shallow depth of field
    Style: Professional food photography, magazine quality, appetizing and realistic.`;

    try {
      const response = await axios.post(
        `${this.geminiImageEndpoint}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: imagePrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // 30 second timeout for image generation
        }
      );

      // Check if response contains image data
      const candidate = response.data.candidates?.[0];
      if (!candidate?.content?.parts) {
        throw new Error('No content parts in response');
      }

      // Look for inline image data in the response parts
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/jpeg';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }

      // If no image found, throw error
      throw new Error('No image data found in response');

    } catch (error) {
      console.error('Image generation error details:', error.response?.data || error.message);
      
      // Check if it's a model not supporting image generation
      if (error.response?.data?.error?.message?.includes('does not support image generation')) {
        console.log('⚠️ Gemini image generation not available, falling back to text-only recipe');
        throw new Error('Image generation not supported');
      }
      
      throw error;
    }
  }
}
