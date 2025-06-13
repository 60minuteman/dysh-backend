import { Body, Controller, Get, Post, Delete, UseGuards, Request, Param, Query } from '@nestjs/common';
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
import { ExploreResponseDto, CookbookResponseDto } from './dto/explore-response.dto';

@ApiTags('explore')
@Controller('api/explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get(':category')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get explore recipes by category',
    description: `Discover recipes from around the world in various categories.
    
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
    - Respects user dietary preferences
    - Full details: ingredients, instructions, pro tips
    - Shows if user has liked each recipe`,
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
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getExploreRecipes(
    @Param('category') category: string,
    @Request() req: any,
    @Query('limit') limit?: number
  ): Promise<ExploreResponseDto> {
    const userId = req.user.id;
    return this.exploreService.getExploreRecipes(category, limit || 10, userId);
  }

  @Post(':recipeId/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Like a recipe (add to cookbook)',
    description: 'Swipe right action - adds recipe to user cookbook for future reference.',
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
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async likeRecipe(
    @Param('recipeId') recipeId: string,
    @Request() req: any
  ): Promise<{ success: boolean }> {
    const userId = req.user.id;
    return this.exploreService.likeRecipe(recipeId, userId);
  }

  @Delete(':recipeId/like')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Unlike a recipe (remove from cookbook)',
    description: 'Remove recipe from user cookbook - can be triggered by swipe left or manual removal.',
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
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async unlikeRecipe(
    @Param('recipeId') recipeId: string,
    @Request() req: any
  ): Promise<{ success: boolean }> {
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