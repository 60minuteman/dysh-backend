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

  async getExploreRecipes(category: string, limit: number, userId: string): Promise<ExploreResponseDto> {
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

    let recipes;
    
    if (exploreCategory === ExploreCategory.TRENDING) {
      // For trending, show existing popular recipes
      recipes = await this.getTrendingRecipes(limit, userId);
    } else {
      // For other categories, get or generate new recipes
      recipes = await this.getOrGenerateExploreRecipes(exploreCategory, limit, userId);
    }

    return {
      recipes,
      category: exploreCategory,
    };
  }

  private async getTrendingRecipes(limit: number, userId: string) {
    // Get most generated recipes as trending
    const trendingRecipes = await this.prisma.recipe.findMany({
      where: {
        generationCount: { gt: 1 }, // Only recipes that have been generated multiple times
      },
      orderBy: {
        generationCount: 'desc',
      },
      take: limit,
      include: {
        userInteractions: {
          where: { userId },
          select: { isLiked: true },
        },
      },
    });

    return trendingRecipes.map(recipe => ({
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
      isLiked: recipe.userInteractions.length > 0 ? recipe.userInteractions[0].isLiked : false,
    }));
  }

  private async getOrGenerateExploreRecipes(category: ExploreCategory, limit: number, userId: string) {
    // Check existing recipes for this category
    let existingRecipes = await this.prisma.recipe.findMany({
      where: { exploreCategory: category },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        userInteractions: {
          where: { userId },
          select: { isLiked: true },
        },
      },
    });

    // If we don't have enough, generate new ones
    if (existingRecipes.length < limit) {
      const recipesToGenerate = limit - existingRecipes.length;
      const newRecipes = await this.generateExploreRecipes(category, recipesToGenerate, userId);
      existingRecipes = [...newRecipes, ...existingRecipes];
    }

    return existingRecipes.slice(0, limit).map(recipe => ({
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
      isLiked: recipe.userInteractions?.length > 0 ? recipe.userInteractions[0].isLiked : false,
    }));
  }

  private async generateExploreRecipes(category: ExploreCategory, count: number, userId: string) {
    // Get user dietary preferences
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    // Define diverse countries for recipe generation
    const countries = [
      'Italy', 'France', 'Japan', 'Mexico', 'India', 'Thailand', 'Greece', 
      'Morocco', 'Brazil', 'Korea', 'Lebanon', 'Nigeria', 'Peru', 'Turkey', 'China'
    ];

    // Category-specific prompts and characteristics
    const categoryPrompts = {
      [ExploreCategory.THIRTY_MIN_MEALS]: 'quick 30-minute meals that are easy to prepare',
      [ExploreCategory.CHEFS_PICK]: 'chef-recommended signature dishes with complex flavors',
      [ExploreCategory.OCCASION]: 'special occasion meals perfect for celebrations and gatherings',
      [ExploreCategory.HEALTHY_LIGHT]: 'healthy, light, and nutritious low-calorie meals',
      [ExploreCategory.COMFORT_FOOD]: 'hearty, satisfying comfort food dishes',
      [ExploreCategory.ONE_POT_MEALS]: 'easy one-pot meals with minimal cleanup required',
    };

    const categoryConstraints = {
      [ExploreCategory.THIRTY_MIN_MEALS]: 'cooking time must be 30 minutes or less',
      [ExploreCategory.CHEFS_PICK]: 'sophisticated techniques and premium ingredients',
      [ExploreCategory.OCCASION]: 'elegant presentation suitable for special events',
      [ExploreCategory.HEALTHY_LIGHT]: 'under 400 calories, high in nutrients, low in saturated fat',
      [ExploreCategory.COMFORT_FOOD]: '400-800 calories, hearty and satisfying',
      [ExploreCategory.ONE_POT_MEALS]: 'everything cooked in a single pot, pan, or cooking vessel',
    };

    // Select random countries for diversity
    const selectedCountries = this.shuffleArray(countries).slice(0, count);

    const prompt = `You are a world-renowned chef specializing in international cuisine. Create exactly ${count} different ${categoryPrompts[category]} from these countries: ${selectedCountries.join(', ')}.

Requirements:
- Each recipe must be from a different country in the list
- ${categoryConstraints[category]}
- ${user?.profile?.dietaryPreference && user.profile.dietaryPreference !== 'NONE' ? `ALL recipes must be ${user.profile.dietaryPreference.toLowerCase()}-friendly` : ''}
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

Create exactly ${count} recipes, each from: ${selectedCountries.join(', ')} respectively.`;

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
        const country = selectedCountries[i] || 'International';

        try {
          // Generate themed image
          let imageUrl = 'https://via.placeholder.com/400x400?text=Recipe+Image';
          
          try {
            imageUrl = await this.cloudinaryService.generateRecipeImage(aiRecipe.title);
          } catch (imageError) {
            console.log(`Failed to generate image for ${aiRecipe.title}:`, imageError.message);
          }

          const savedRecipe = await this.prisma.recipe.create({
            data: {
              title: aiRecipe.title,
              duration: aiRecipe.duration,
              calories: aiRecipe.calories,
              rating: aiRecipe.rating,
              imageUrl,
              country: aiRecipe.country || country,
              exploreCategory: category,
              category: this.mapExploreToRecipeCategory(category),
              ingredients: aiRecipe.ingredients || [],
              instructions: aiRecipe.instructions || [],
              proTips: aiRecipe.proTips || [],
              generationCount: 1,
            },
            include: {
              userInteractions: {
                where: { userId },
                select: { isLiked: true },
              },
            },
          });

          savedRecipes.push(savedRecipe);
        } catch (error) {
          console.error(`Failed to save recipe ${aiRecipe.title}:`, error);
        }
      }

      return savedRecipes;
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

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 