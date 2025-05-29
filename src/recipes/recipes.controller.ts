import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
import { RecipeResponseDto, RecipeErrorDto } from './dto/recipe-response.dto';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generate 3 personalized location-based meals',
    description: `Generate 3 different, personalized meals based on:
    • User's dietary preferences (from profile)
    • User's preferred servings (from profile) 
    • User's location for cuisine style (from profile or override with country parameter)
    • Provided ingredients
    
    Each meal includes structured data: name, cooking time, calories, rating, ingredients list, step-by-step instructions, and professional cooking tips.`,
  })
  @ApiBody({
    type: GenerateRecipeDto,
    description: 'Ingredients and optional country for cuisine style',
    examples: {
      defaultLocation: {
        summary: 'Use User Location (Default)',
        description: 'Generate meals based on user\'s location from profile',
        value: {
          ingredients: ['chicken', 'rice', 'vegetables', 'garlic', 'soy sauce'],
        },
      },
      italianCuisine: {
        summary: 'Italian Cuisine Override',
        description: 'Generate Italian-style meals regardless of user location',
        value: {
          ingredients: ['pasta', 'tomatoes', 'garlic', 'basil', 'olive oil'],
          country: 'Italy'
        },
      },
      japaneseCuisine: {
        summary: 'Japanese Cuisine Override',
        description: 'Generate Japanese-style meals',
        value: {
          ingredients: ['rice', 'salmon', 'nori', 'cucumber', 'soy sauce'],
          country: 'Japan'
        },
      },
      mexicanCuisine: {
        summary: 'Mexican Cuisine Override', 
        description: 'Generate Mexican-style meals',
        value: {
          ingredients: ['chicken', 'beans', 'corn', 'peppers', 'cheese'],
          country: 'Mexico'
        },
      },
      veganMeals: {
        summary: 'Vegan Meals (Any Cuisine)',
        description: 'Perfect for users with vegan dietary preference',
        value: {
          ingredients: ['quinoa', 'chickpeas', 'spinach', 'tomatoes', 'avocado'],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: '3 personalized meals generated successfully with structured data including: meal names, cooking times, calories, ratings, ingredients lists, step-by-step instructions, and professional cooking tips',
    type: RecipeResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required - valid JWT token needed',
  })
  @ApiBadRequestResponse({
    description: 'Invalid ingredients provided or validation error',
    type: RecipeErrorDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'AI service unavailable or internal server error',
    type: RecipeErrorDto,
  })
  async generateRecipe(
    @Body() generateRecipeDto: GenerateRecipeDto,
    @Request() req: any
  ): Promise<RecipeResponseDto> {
    const userId = req.user.id;
    return this.recipesService.generatePersonalizedRecipe(generateRecipeDto, userId);
  }
}
