import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { GeminiService } from '../common/services/gemini.service';
import { ConfigService } from '@nestjs/config';
import { ExploreCategory, RecipeCategory } from '@prisma/client';
import { ExploreResponseDto, CookbookResponseDto } from './dto/explore-response.dto';

@Injectable()
export class ExploreService {
  private readonly geminiApiKey: string;

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private geminiService: GeminiService,
    private configService: ConfigService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
  }

  async getExploreRecipes(category: string, limit: number, userId: string | null): Promise<ExploreResponseDto> {
    // Validate category
    const validCategories = [
      'trending', 'thirty-min-meals', 'chefs-pick', 'occasion', 
      'healthy-light', 'comfort-food', 'one-pot-meals'
    ];
    
    if (!validCategories.includes(category)) {
      throw new BadRequestException(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Map category to enum
    const categoryMap: { [key: string]: ExploreCategory } = {
      'trending': ExploreCategory.TRENDING,
      'thirty-min-meals': ExploreCategory.THIRTY_MIN_MEALS,
      'chefs-pick': ExploreCategory.CHEFS_PICK,
      'occasion': ExploreCategory.OCCASION,
      'healthy-light': ExploreCategory.HEALTHY_LIGHT,
      'comfort-food': ExploreCategory.COMFORT_FOOD,
      'one-pot-meals': ExploreCategory.ONE_POT_MEALS,
    };

    const exploreCategory = categoryMap[category];

    // Always serve from existing database recipes (no more on-demand generation)
    const recipes = await this.getExistingExploreRecipes(exploreCategory, limit, userId);

    return {
      recipes,
      category: exploreCategory,
    };
  }

  private async getExistingExploreRecipes(category: ExploreCategory, limit: number, userId: string | null) {
    let whereClause: any;

    if (category === ExploreCategory.TRENDING) {
      // For trending, show recipes specifically marked as trending
      // If no trending recipes exist, fall back to most liked recipes
      const trendingCount = await this.prisma.recipe.count({
        where: { exploreCategory: ExploreCategory.TRENDING }
      });
      
      if (trendingCount > 0) {
        whereClause = { exploreCategory: ExploreCategory.TRENDING };
      } else {
        // Fallback to most liked recipes if no trending recipes exist
        whereClause = {
          exploreCategory: { not: null }, // Any explore category
          userInteractions: {
            some: {
              isLiked: true,
            },
          },
        };
      }
    } else {
      // For specific categories, show recipes from that category
      whereClause = { exploreCategory: category };
    }

    const recipes = await this.prisma.recipe.findMany({
      where: whereClause,
      take: limit,
      orderBy: category === ExploreCategory.TRENDING 
        ? [
            // For trending, order by likes count and recency
            { userInteractions: { _count: 'desc' } },
            { createdAt: 'desc' }
          ]
        : [
            // For other categories, randomize the order for variety
            { createdAt: 'desc' }
          ],
      include: {
        userInteractions: userId ? {
          where: { userId },
          select: { isLiked: true },
        } : false,
        _count: {
          select: { userInteractions: true },
        },
      },
    });

    // Shuffle recipes for variety (except trending which should stay ordered by popularity)
    const shuffledRecipes = category === ExploreCategory.TRENDING 
      ? recipes 
      : this.shuffleArray(recipes);

    return shuffledRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      duration: recipe.duration,
      calories: recipe.calories,
      rating: recipe.rating,
      imageUrl: recipe.imageUrl,
      country: recipe.country || 'International',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      proTips: recipe.proTips,
      isLiked: userId && recipe.userInteractions?.length > 0 ? recipe.userInteractions[0].isLiked : false,
    }));
  }

  // Admin method for generating new explore recipes
  async adminGenerateExploreRecipes(
    category: ExploreCategory, 
    count: number, 
    countries?: string[], 
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  ) {
    // Use provided countries or default diverse set
    const defaultCountries = [
      'Italy', 'France', 'Japan', 'Mexico', 'India', 'Thailand', 'Greece', 
      'Morocco', 'Brazil', 'Korea', 'Lebanon', 'Nigeria', 'Peru', 'Turkey', 'China'
    ];
    
    const recipesCountries = countries && countries.length > 0 
      ? countries 
      : this.shuffleArray(defaultCountries).slice(0, count);

    // Category-specific prompts and characteristics
    const categoryPrompts = {
      [ExploreCategory.TRENDING]: 'popular trending meals that are currently viral and in-demand',
      [ExploreCategory.THIRTY_MIN_MEALS]: 'quick 30-minute meals that are easy to prepare',
      [ExploreCategory.CHEFS_PICK]: 'chef-recommended signature dishes with complex flavors',
      [ExploreCategory.OCCASION]: 'special occasion meals perfect for celebrations and gatherings',
      [ExploreCategory.HEALTHY_LIGHT]: 'healthy, light, and nutritious low-calorie meals',
      [ExploreCategory.COMFORT_FOOD]: 'hearty, satisfying comfort food dishes',
      [ExploreCategory.ONE_POT_MEALS]: 'easy one-pot meals with minimal cleanup required',
    };

    const categoryConstraints = {
      [ExploreCategory.TRENDING]: 'modern, Instagram-worthy presentation, popular ingredients and techniques',
      [ExploreCategory.THIRTY_MIN_MEALS]: 'cooking time must be 30 minutes or less',
      [ExploreCategory.CHEFS_PICK]: 'sophisticated techniques and premium ingredients',
      [ExploreCategory.OCCASION]: 'elegant presentation suitable for special events',
      [ExploreCategory.HEALTHY_LIGHT]: 'under 400 calories, high in nutrients, low in saturated fat',
      [ExploreCategory.COMFORT_FOOD]: '400-800 calories, hearty and satisfying',
      [ExploreCategory.ONE_POT_MEALS]: 'everything cooked in a single pot, pan, or cooking vessel',
    };

    // Meal type specific prompts
    const mealTypePrompts = {
      'BREAKFAST': 'breakfast dishes that are energizing and perfect for starting the day',
      'LUNCH': 'lunch meals that are satisfying and balanced for midday dining',
      'DINNER': 'dinner recipes that are hearty and perfect for evening meals'
    };

    const mealTypeConstraints = {
      'BREAKFAST': 'suitable for breakfast time, energizing, 200-500 calories',
      'LUNCH': 'suitable for lunch, balanced and filling, 400-700 calories',
      'DINNER': 'suitable for dinner, satisfying and complete, 500-800 calories'
    };

    // Build the prompt
    const basePrompt = mealType 
      ? `${mealTypePrompts[mealType]} that are also ${categoryPrompts[category]}`
      : categoryPrompts[category];

    const baseConstraints = mealType 
      ? `${mealTypeConstraints[mealType]} AND ${categoryConstraints[category]}`
      : categoryConstraints[category];

    const prompt = `You are a world-renowned chef specializing in international cuisine. Create exactly ${count} different ${basePrompt} from these countries: ${recipesCountries.join(', ')}.

Requirements:
- Each recipe must be from a different country in the list
- ${baseConstraints}
- Include diverse dietary options (vegetarian, meat-based, etc.)
- Each recipe should authentically represent its country's cuisine

CRITICAL: Respond ONLY with valid JSON in this exact format:

{
  "recipes": [
    {
      "title": "Authentic Recipe Name",
      "duration": "25 min",
      "calories": "350 kcal", 
      "rating": "4.7",
      "country": "Italy",
      "ingredients": [
        "2 cups specific ingredient with measurement",
        "1 tbsp another ingredient"
      ],
      "instructions": [
        "Step 1: Detailed cooking instruction",
        "Step 2: Another detailed step"
      ],
      "proTips": [
        "Professional tip for better results",
        "Traditional technique or secret"
      ]
    }
  ]
}

Create exactly ${count} recipes, each from: ${recipesCountries.join(', ')} respectively.`;

    try {
      let parsedResponse: any;
      
      if (this.geminiApiKey) {
        parsedResponse = await this.geminiService.generateRecipes(prompt);
      } else {
        throw new Error('No AI provider available');
      }

      const aiRecipes = parsedResponse.recipes || [];

      // Save recipes to database
      const savedRecipes = [];
      for (let i = 0; i < aiRecipes.length; i++) {
        const aiRecipe = aiRecipes[i];
        const country = recipesCountries[i] || 'International';

        try {
          // Generate themed image
          let imageUrl = 'https://via.placeholder.com/400x400?text=Recipe+Image';
          
          try {
            imageUrl = await this.cloudinaryService.generateRecipeImage(aiRecipe.title);
          } catch (imageError) {
            console.log(`Failed to generate image for ${aiRecipe.title}:`, imageError.message);
          }

          const recipeCategory = mealType 
            ? this.mapMealTypeToRecipeCategory(mealType)
            : this.mapExploreToRecipeCategory(category);

          const savedRecipe = await this.prisma.recipe.create({
            data: {
              title: aiRecipe.title,
              duration: aiRecipe.duration,
              calories: aiRecipe.calories,
              rating: aiRecipe.rating,
              imageUrl,
              country: aiRecipe.country || country,
              exploreCategory: category,
              category: recipeCategory,
              ingredients: aiRecipe.ingredients || [],
              instructions: aiRecipe.instructions || [],
              proTips: aiRecipe.proTips || [],
              generationCount: 1,
            },
          });

          // Add isLiked property (new recipes are never liked initially)
          (savedRecipe as any).isLiked = false;

          savedRecipes.push(savedRecipe);
        } catch (error) {
          console.error(`Failed to save recipe ${aiRecipe.title}:`, error);
        }
      }

      return {
        success: true,
        generated: savedRecipes.length,
        recipes: savedRecipes,
        message: `Successfully generated ${savedRecipes.length} ${category.toLowerCase().replace('_', ' ')} recipes`,
      };
    } catch (error) {
      console.error('Failed to generate explore recipes:', error);
      throw new HttpException(
        'Failed to generate explore recipes',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async likeRecipe(recipeId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.userRecipeInteraction.upsert({
        where: {
          userId_recipeId: {
            userId,
            recipeId,
          },
        },
        update: {
          isLiked: true,
        },
        create: {
          userId,
          recipeId,
          isLiked: true,
          isViewed: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to like recipe:', error);
      throw new HttpException(
        'Failed to like recipe',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unlikeRecipe(recipeId: string, userId: string): Promise<{ success: boolean }> {
    try {
      await this.prisma.userRecipeInteraction.upsert({
        where: {
          userId_recipeId: {
            userId,
            recipeId,
          },
        },
        update: {
          isLiked: false,
        },
        create: {
          userId,
          recipeId,
          isLiked: false,
          isViewed: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to unlike recipe:', error);
      throw new HttpException(
        'Failed to unlike recipe',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCookbook(userId: string, limit: number = 20, offset: number = 0): Promise<CookbookResponseDto> {
    const [likedRecipes, totalCount] = await Promise.all([
      this.prisma.userRecipeInteraction.findMany({
        where: {
          userId,
          isLiked: true,
        },
        include: {
          recipe: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      this.prisma.userRecipeInteraction.count({
        where: {
          userId,
          isLiked: true,
        },
      }),
    ]);

    const recipes = likedRecipes.map(interaction => ({
      id: interaction.recipe.id,
      title: interaction.recipe.title,
      duration: interaction.recipe.duration,
      calories: interaction.recipe.calories,
      rating: interaction.recipe.rating,
      imageUrl: interaction.recipe.imageUrl,
      country: interaction.recipe.country || 'International',
      ingredients: interaction.recipe.ingredients,
      instructions: interaction.recipe.instructions,
      proTips: interaction.recipe.proTips,
      isLiked: true, // All recipes in cookbook are liked
    }));

    return {
      recipes,
      totalCount,
    };
  }

  private mapExploreToRecipeCategory(exploreCategory: ExploreCategory): RecipeCategory {
    // Map explore categories to appropriate recipe categories
    const mapping = {
      [ExploreCategory.TRENDING]: RecipeCategory.DINNER,
      [ExploreCategory.THIRTY_MIN_MEALS]: RecipeCategory.LUNCH,
      [ExploreCategory.CHEFS_PICK]: RecipeCategory.DINNER,
      [ExploreCategory.OCCASION]: RecipeCategory.DINNER,
      [ExploreCategory.HEALTHY_LIGHT]: RecipeCategory.LOW_CARB,
      [ExploreCategory.COMFORT_FOOD]: RecipeCategory.DINNER,
      [ExploreCategory.ONE_POT_MEALS]: RecipeCategory.LUNCH,
    };
    
    return mapping[exploreCategory] || RecipeCategory.DINNER;
  }

  private mapMealTypeToRecipeCategory(mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER'): RecipeCategory {
    const mapping = {
      'BREAKFAST': RecipeCategory.BREAKFAST,
      'LUNCH': RecipeCategory.LUNCH,
      'DINNER': RecipeCategory.DINNER,
    };
    
    return mapping[mealType];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 