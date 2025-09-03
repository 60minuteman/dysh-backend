import { Controller, Post, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RecipeImageUpdateService } from './recipe-image-update.service';

@ApiTags('recipe-images')
@Controller('recipe-images')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class RecipeImageUpdateController {
  constructor(private readonly imageUpdateService: RecipeImageUpdateService) {}

  @Post('update-all')
  @ApiOperation({
    summary: 'Update all recipe images with AI-generated images',
    description: 'Batch update all existing recipes that have placeholder images with AI-generated images',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch update completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        updated: { type: 'number' },
        failed: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async updateAllImages() {
    const result = await this.imageUpdateService.updateAllRecipeImages();
    
    return {
      success: true,
      updated: result.updated,
      failed: result.failed,
      message: `Updated ${result.updated} recipes, ${result.failed} failed`,
    };
  }

  @Post('update-category/:category')
  @ApiOperation({
    summary: 'Update recipe images for a specific category',
    description: 'Update all recipes in a specific category that have placeholder images',
  })
  @ApiResponse({
    status: 200,
    description: 'Category update completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        category: { type: 'string' },
        updated: { type: 'number' },
        failed: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async updateCategoryImages(@Param('category') category: string) {
    const result = await this.imageUpdateService.updateCategoryImages(category);
    
    return {
      success: true,
      category,
      updated: result.updated,
      failed: result.failed,
      message: `Updated ${result.updated} ${category} recipes, ${result.failed} failed`,
    };
  }

  @Post('update-single/:recipeId')
  @ApiOperation({
    summary: 'Update a single recipe image',
    description: 'Update the image for a specific recipe with AI-generated image',
  })
  @ApiResponse({
    status: 200,
    description: 'Single recipe update completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        recipeId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async updateSingleRecipe(@Param('recipeId') recipeId: string) {
    const success = await this.imageUpdateService.updateSingleRecipeImage(recipeId);
    
    return {
      success,
      recipeId,
      message: success ? 'Recipe image updated successfully' : 'Failed to update recipe image',
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get recipe image statistics',
    description: 'Get statistics about recipe images including counts of placeholder vs AI-generated images',
  })
  @ApiResponse({
    status: 200,
    description: 'Image statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            placeholder: { type: 'number' },
            aiGenerated: { type: 'number' },
            byCategory: { type: 'object' },
          },
        },
      },
    },
  })
  async getImageStats() {
    const stats = await this.imageUpdateService.getImageStats();
    
    return {
      success: true,
      stats,
    };
  }
}
