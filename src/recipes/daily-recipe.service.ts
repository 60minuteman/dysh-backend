import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RecipesService } from './recipes.service';
import { RecipeCategory } from '@prisma/client';
import { DailyRecipeResponseDto, DailyRecipesQueryDto, DailyRecipesListResponseDto } from './dto/daily-recipe.dto';

@Injectable()
export class DailyRecipeService {
  private readonly logger = new Logger(DailyRecipeService.name);

  // All recipe categories for daily generation
  private readonly DAILY_CATEGORIES: RecipeCategory[] = [
    RecipeCategory.BREAKFAST,
    RecipeCategory.BREAKFAST_LOW_CARB,
    RecipeCategory.BREAKFAST_HIGH_PROTEIN,
    RecipeCategory.LUNCH,
    RecipeCategory.LUNCH_LOW_CARB, 
    RecipeCategory.LUNCH_HIGH_PROTEIN,
    RecipeCategory.DINNER,
    RecipeCategory.DINNER_LOW_CARB,
    RecipeCategory.DINNER_HIGH_PROTEIN,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipesService: RecipesService,
  ) {}

  // Run every hour to check for users whose local time is midnight
  @Cron('0 * * * *', {
    name: 'generate-daily-recipes',
    timeZone: 'UTC',
  })
  async generateDailyRecipesForAllUsers() {
    this.logger.log('Starting daily recipe generation check...');
    
    try {
      // Get current UTC time
      const now = new Date();
      const currentUtcHour = now.getUTCHours();
      
      // Find all active user locations where it's currently midnight
      const locations = await this.prisma.userLocation.findMany({
        where: {
          isActive: true,
        },
        include: {
          user: {
            include: {
              profile: true,
            }
          }
        }
      });

      for (const location of locations) {
        try {
          // Calculate what hour it is in the user's timezone
          const userLocalHour = this.getLocalHourFromTimezone(now, location.timezone);
          
          // If it's midnight (0 hour) in user's timezone, generate recipes
          if (userLocalHour === 0) {
            await this.generateDailyRecipesForUser(location.userId, location.id, location);
          }
        } catch (error) {
          this.logger.error(`Failed to generate recipes for user ${location.userId} at location ${location.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to run daily recipe generation:', error);
    }
  }

  async generateDailyRecipesForUser(userId: string, locationId: string, location: any) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const userLocalTime = new Date(); // This should be calculated based on timezone, but for simplicity using current time

    this.logger.log(`Generating daily recipes for user ${userId} at location ${location.name} (${location.country})`);

    // Check if recipes already generated for today for this location
    const existingRecipes = await this.prisma.dailyRecipe.findMany({
      where: {
        userId,
        locationId,
        generatedDate: today
      }
    });

    if (existingRecipes.length > 0) {
      this.logger.log(`Recipes already generated for user ${userId} on ${today}`);
      return;
    }

    // Get user's dietary preferences
    const userProfile = await this.prisma.userProfile.findUnique({
      where: { userId }
    });

    let recipesGenerated = 0;

    // Generate 5 recipes for each category
    for (const category of this.DAILY_CATEGORIES) {
      try {
        // Generate recipes using the existing recipes service with location-based cuisine
        const recipes = await this.recipesService.generateRecipes(
          category, 
          5, 
          userProfile?.dietaryPreference,
          location.country // Pass country for location-based cuisine
        );

        // Save each recipe and create daily recipe records
        for (const recipeData of recipes) {
          // Save the recipe to the database
          const savedRecipe = await this.prisma.recipe.create({
            data: {
              title: recipeData.title,
              duration: recipeData.duration,
              calories: recipeData.calories,
              rating: recipeData.rating,
              imageUrl: recipeData.imageUrl,
              category: category,
              ingredients: recipeData.ingredients,
              instructions: recipeData.instructions,
              proTips: recipeData.proTips,
              country: location.country,
              generationCount: 1,
            }
          });

          // Create daily recipe record
          await this.prisma.dailyRecipe.create({
            data: {
              userId,
              locationId,
              recipeId: savedRecipe.id,
              category,
              generatedAt: userLocalTime,
              generatedDate: today,
            }
          });

          recipesGenerated++;
        }

        this.logger.log(`Generated 5 ${category} recipes for user ${userId}`);
      } catch (error) {
        this.logger.error(`Failed to generate ${category} recipes for user ${userId}:`, error);
      }
    }

    this.logger.log(`Successfully generated ${recipesGenerated} total recipes for user ${userId} at ${location.name}`);
  }

  async getDailyRecipes(userId: string, queryDto: DailyRecipesQueryDto): Promise<DailyRecipesListResponseDto> {
    const { date, locationId, category, limit = 20, offset = 0 } = queryDto;
    
    // Convert string parameters to numbers
    const actualLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;
    const actualOffset = typeof offset === 'string' ? parseInt(offset, 10) : offset;
    
    // Default to today if no date provided
    const queryDate = date || new Date().toISOString().split('T')[0];

    const whereClause: any = {
      userId,
      generatedDate: queryDate,
    };

    if (locationId) {
      whereClause.locationId = locationId;
    }

    if (category) {
      whereClause.category = category;
    }

    // Get total count
    const totalCount = await this.prisma.dailyRecipe.count({
      where: whereClause
    });

    // Get paginated results
    const dailyRecipes = await this.prisma.dailyRecipe.findMany({
      where: whereClause,
      include: {
        recipe: true,
        location: true,
      },
      orderBy: [
        { category: 'asc' },
        { generatedAt: 'desc' }
      ],
      take: actualLimit,
      skip: actualOffset,
    });

    const recipes = dailyRecipes.map(dailyRecipe => ({
      id: dailyRecipe.id,
      category: dailyRecipe.category,
      generatedAt: dailyRecipe.generatedAt,
      generatedDate: dailyRecipe.generatedDate,
      recipe: {
        id: dailyRecipe.recipe.id,
        title: dailyRecipe.recipe.title,
        duration: dailyRecipe.recipe.duration,
        calories: dailyRecipe.recipe.calories,
        rating: dailyRecipe.recipe.rating,
        imageUrl: dailyRecipe.recipe.imageUrl,
        ingredients: dailyRecipe.recipe.ingredients,
        instructions: dailyRecipe.recipe.instructions,
        proTips: dailyRecipe.recipe.proTips,
      },
      locationName: dailyRecipe.location.name,
      locationCountry: dailyRecipe.location.country,
    }));

    return {
      recipes,
      totalCount,
      limit: actualLimit,
      offset: actualOffset,
    };
  }

  async getDailyRecipesByCategory(userId: string, category: RecipeCategory, date?: string): Promise<DailyRecipeResponseDto[]> {
    const queryDate = date || new Date().toISOString().split('T')[0];

    const dailyRecipes = await this.prisma.dailyRecipe.findMany({
      where: {
        userId,
        category,
        generatedDate: queryDate,
      },
      include: {
        recipe: true,
        location: true,
      },
      orderBy: { generatedAt: 'desc' },
    });

    return dailyRecipes.map(dailyRecipe => ({
      id: dailyRecipe.id,
      category: dailyRecipe.category,
      generatedAt: dailyRecipe.generatedAt,
      generatedDate: dailyRecipe.generatedDate,
      recipe: {
        id: dailyRecipe.recipe.id,
        title: dailyRecipe.recipe.title,
        duration: dailyRecipe.recipe.duration,
        calories: dailyRecipe.recipe.calories,
        rating: dailyRecipe.recipe.rating,
        imageUrl: dailyRecipe.recipe.imageUrl,
        ingredients: dailyRecipe.recipe.ingredients,
        instructions: dailyRecipe.recipe.instructions,
        proTips: dailyRecipe.recipe.proTips,
      },
      locationName: dailyRecipe.location.name,
      locationCountry: dailyRecipe.location.country,
    }));
  }

  // Manual trigger for testing
  async manuallyGenerateRecipesForUser(userId: string): Promise<{ message: string; recipesGenerated: number }> {
    const activeLocations = await this.prisma.userLocation.findMany({
      where: {
        userId,
        isActive: true,
      }
    });

    if (activeLocations.length === 0) {
      throw new Error('No active locations found for user');
    }

    let totalRecipesGenerated = 0;

    for (const location of activeLocations) {
      await this.generateDailyRecipesForUser(userId, location.id, location);
      totalRecipesGenerated += this.DAILY_CATEGORIES.length * 5; // 9 categories * 5 recipes each
    }

    return {
      message: `Successfully generated daily recipes for ${activeLocations.length} location(s)`,
      recipesGenerated: totalRecipesGenerated
    };
  }

  private getLocalHourFromTimezone(utcDate: Date, timezone: string): number {
    try {
      // Create a date formatter for the specific timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit'
      });

      const localHour = parseInt(formatter.format(utcDate));
      return localHour;
    } catch (error) {
      this.logger.error(`Failed to get local hour for timezone ${timezone}:`, error);
      return -1; // Return invalid hour to skip this location
    }
  }
} 