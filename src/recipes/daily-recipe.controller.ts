import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DailyRecipeService } from './daily-recipe.service';
import { 
  DailyRecipeResponseDto, 
  DailyRecipesQueryDto, 
  DailyRecipesListResponseDto 
} from './dto/daily-recipe.dto';
import { AuthGuard } from '@nestjs/passport';
import { RecipeCategory } from '@prisma/client';

@ApiTags('Daily Recipes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/daily-recipes')
export class DailyRecipeController {
  constructor(private readonly dailyRecipeService: DailyRecipeService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get daily recipes',
    description: 'Get daily generated recipes for the user with optional filters for date, location, and category.'
  })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (defaults to today)' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter by specific location ID' })
  @ApiQuery({ name: 'category', required: false, enum: RecipeCategory, description: 'Filter by recipe category' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recipes to return (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of recipes to skip (default: 0)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily recipes retrieved successfully',
    type: DailyRecipesListResponseDto 
  })
  async getDailyRecipes(
    @Request() req,
    @Query() queryDto: DailyRecipesQueryDto,
  ): Promise<DailyRecipesListResponseDto> {
    return this.dailyRecipeService.getDailyRecipes(req.user.id, queryDto);
  }

  @Get('category/:category')
  @ApiOperation({ 
    summary: 'Get daily recipes by category',
    description: 'Get daily recipes for a specific category (e.g., BREAKFAST, LUNCH, DINNER).'
  })
  @ApiQuery({ name: 'date', required: false, description: 'Date in YYYY-MM-DD format (defaults to today)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily recipes for category retrieved successfully',
    type: [DailyRecipeResponseDto] 
  })
  async getDailyRecipesByCategory(
    @Request() req,
    @Param('category') category: string,
    @Query('date') date?: string,
  ): Promise<DailyRecipeResponseDto[]> {
    // Convert string category to enum
    const categoryMap: { [key: string]: RecipeCategory } = {
      'breakfast': RecipeCategory.BREAKFAST,
      'breakfast-low-carb': RecipeCategory.BREAKFAST_LOW_CARB,
      'breakfast-high-protein': RecipeCategory.BREAKFAST_HIGH_PROTEIN,
      'lunch': RecipeCategory.LUNCH,
      'lunch-low-carb': RecipeCategory.LUNCH_LOW_CARB,
      'lunch-high-protein': RecipeCategory.LUNCH_HIGH_PROTEIN,
      'dinner': RecipeCategory.DINNER,
      'dinner-low-carb': RecipeCategory.DINNER_LOW_CARB,
      'dinner-high-protein': RecipeCategory.DINNER_HIGH_PROTEIN,
    };
    
    const recipeCategory = categoryMap[category.toLowerCase()];
    if (!recipeCategory) {
      throw new Error(`Invalid category: ${category}`);
    }
    
    return this.dailyRecipeService.getDailyRecipesByCategory(req.user.id, recipeCategory, date);
  }

  @Post('generate')
  @ApiOperation({ 
    summary: 'Manually generate daily recipes',
    description: 'Manually trigger daily recipe generation for the current user (for testing purposes).'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Daily recipes generated successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully generated daily recipes for 2 location(s)' },
        recipesGenerated: { type: 'number', example: 90 }
      }
    }
  })
  async manuallyGenerateRecipes(@Request() req): Promise<{ message: string; recipesGenerated: number }> {
    return this.dailyRecipeService.manuallyGenerateRecipesForUser(req.user.id);
  }
} 