import { Body, Controller, Get, Post, Delete, UseGuards, Request, Param, Query, UnauthorizedException } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExploreService } from './explore.service';
import { DailyRecipeService } from './daily-recipe.service';
import { ExploreResponseDto, CookbookResponseDto } from './dto/explore-response.dto';

@ApiTags('explore')
@Controller('api/explore')
export class ExploreController {
  constructor(
    private readonly exploreService: ExploreService,
    private readonly dailyRecipeService: DailyRecipeService,
  ) {}

  @Get(':category')
  @ApiOperation({
    summary: 'Get explore recipes by category (No auth required)',
    description: `Discover recipes from around the world in various categories. Authentication is optional - without auth, all recipes show as not liked.
    
    **Categories Available:**
    - **trending** - Popular recipes from platform users
    - **thirty-min-meals** - Quick recipes under 30 minutes  
    - **chefs-pick** - Chef-recommended signature dishes
    - **occasion** - Special celebration meals
    - **healthy-light** - Nutritious low-calorie options
    - **comfort-food** - Hearty, satisfying dishes
    - **one-pot-meals** - Easy cleanup recipes
    
    **Features:**
    - Recipes from 15+ countries worldwide
    - Works without authentication for browsing
    - Full details: ingredients, instructions, pro tips
    - Shows liked status only for authenticated users`,
  })
  @ApiParam({
    name: 'category',
    description: 'Explore category',
    enum: ['trending', 'thirty-min-meals', 'chefs-pick', 'occasion', 'healthy-light', 'comfort-food', 'one-pot-meals'],
    example: 'chefs-pick',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of recipes to return',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Explore recipes retrieved successfully',
    type: ExploreResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid category provided',
  })
  async getExploreRecipes(
    @Param('category') category: string,
    @Request() req: any,
    @Query('limit') limit?: number
  ): Promise<ExploreResponseDto> {
    // Handle backward compatibility for "daily" category
    if (category === 'daily') {
      const userId = req.user?.id || null;
      
      if (!userId) {
        // Return empty response for guest users since daily recipes require authentication
        return {
          recipes: [],
          category: 'daily'
        };
      }

      // Get daily recipes and convert to explore format
      const dailyRecipesResponse = await this.dailyRecipeService.getDailyRecipes(userId, {
        limit: limit || 10,
        offset: 0
      });

      // Convert daily recipes to explore format
      const exploreRecipes = dailyRecipesResponse.recipes.map(dailyRecipe => ({
        id: dailyRecipe.recipe.id,
        title: dailyRecipe.recipe.title,
        duration: dailyRecipe.recipe.duration,
        calories: dailyRecipe.recipe.calories,
        rating: dailyRecipe.recipe.rating,
        imageUrl: dailyRecipe.recipe.imageUrl,
        country: dailyRecipe.locationCountry,
        ingredients: dailyRecipe.recipe.ingredients,
        instructions: dailyRecipe.recipe.instructions,
        proTips: dailyRecipe.recipe.proTips,
        isLiked: false, // Daily recipes are not liked by default
      }));

      return {
        recipes: exploreRecipes,
        category: 'daily'
      };
    }

    // Extract userId from token if present, otherwise null for guest users
    const userId = req.user?.id || null;
    return this.exploreService.getExploreRecipes(category, limit || 10, userId);
  }

  @Post(':recipeId/like')
  @ApiOperation({
    summary: 'Like a recipe (add to cookbook) - Authentication required',
    description: 'Swipe right action - adds recipe to user cookbook. Requires user to be logged in.',
  })
  @ApiParam({
    name: 'recipeId',
    description: 'Recipe ID to like',
    example: 'cmbmhbb2b000lsbv5tsj6etc2',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe liked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required to like recipes',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Please sign up or log in to save recipes to your cookbook' },
        authRequired: { type: 'boolean', example: true },
      },
    },
  })
  async likeRecipe(
    @Param('recipeId') recipeId: string,
    @Request() req: any
  ): Promise<{ success: boolean; message?: string; authRequired?: boolean }> {
    // Check if user is authenticated
    if (!req.user?.id) {
      return {
        success: false,
        message: 'Please sign up or log in to save recipes to your cookbook',
        authRequired: true
      };
    }
    
    const userId = req.user.id;
    return this.exploreService.likeRecipe(recipeId, userId);
  }

  @Delete(':recipeId/like')
  @ApiOperation({
    summary: 'Unlike a recipe (remove from cookbook) - Authentication required',
    description: 'Remove recipe from user cookbook. Requires user to be logged in.',
  })
  @ApiParam({
    name: 'recipeId',
    description: 'Recipe ID to unlike',
    example: 'cmbmhbb2b000lsbv5tsj6etc2',
  })
  @ApiResponse({
    status: 200,
    description: 'Recipe unliked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required to unlike recipes',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Please sign up or log in to manage your cookbook' },
        authRequired: { type: 'boolean', example: true },
      },
    },
  })
  async unlikeRecipe(
    @Param('recipeId') recipeId: string,
    @Request() req: any
  ): Promise<{ success: boolean; message?: string; authRequired?: boolean }> {
    // Check if user is authenticated
    if (!req.user?.id) {
      return {
        success: false,
        message: 'Please sign up or log in to manage your cookbook',
        authRequired: true
      };
    }
    
    const userId = req.user.id;
    return this.exploreService.unlikeRecipe(recipeId, userId);
  }
}

@ApiTags('cookbook')
@Controller('api/cookbook')
export class CookbookController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user cookbook',
    description: `Retrieve all recipes the user has liked/saved from explore.
    
    **Features:**
    - Personal collection of liked recipes
    - Full recipe details with instructions and tips
    - Pagination support for large collections
    - Sorted by most recently added`,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of recipes to return',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Number of recipes to skip (for pagination)',
    required: false,
    type: Number,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Cookbook retrieved successfully',
    type: CookbookResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getCookbook(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ): Promise<CookbookResponseDto> {
    const userId = req.user.id;
    return this.exploreService.getCookbook(userId, limit || 20, offset || 0);
  }
} 