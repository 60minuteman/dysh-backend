import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Injectable()
export class RecipeImageUpdateService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Update all existing recipes with AI-generated images
   */
  async updateAllRecipeImages(): Promise<{ updated: number; failed: number }> {
    console.log('🔄 Starting batch update of recipe images...');
    
    // Get all recipes that still have placeholder images
    const recipes = await this.prisma.recipe.findMany({
      where: {
        OR: [
          { imageUrl: { contains: 'dummyimage.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { contains: 'via.placeholder' } },
        ],
      },
      select: {
        id: true,
        title: true,
        ingredients: true,
        country: true,
        imageUrl: true,
      },
    });

    console.log(`📊 Found ${recipes.length} recipes to update`);

    let updated = 0;
    let failed = 0;

    for (const recipe of recipes) {
      try {
        console.log(`🎨 Generating image for: ${recipe.title}`);
        
        const newImageUrl = await this.cloudinaryService.generateRecipeImage(
          recipe.title,
          recipe.ingredients as string[],
          recipe.country || 'International'
        );

        // Update the recipe with the new image URL
        await this.prisma.recipe.update({
          where: { id: recipe.id },
          data: { imageUrl: newImageUrl },
        });

        updated++;
        console.log(`✅ Updated: ${recipe.title}`);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to update ${recipe.title}:`, error.message);
      }
    }

    console.log(`🎉 Batch update completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  }

  /**
   * Update images for recipes in a specific category
   */
  async updateCategoryImages(category: string): Promise<{ updated: number; failed: number }> {
    console.log(`🔄 Updating images for ${category} recipes...`);
    
    const recipes = await this.prisma.recipe.findMany({
      where: {
        category: category as any,
        OR: [
          { imageUrl: { contains: 'dummyimage.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { contains: 'via.placeholder' } },
        ],
      },
      select: {
        id: true,
        title: true,
        ingredients: true,
        country: true,
        imageUrl: true,
      },
    });

    console.log(`📊 Found ${recipes.length} ${category} recipes to update`);

    let updated = 0;
    let failed = 0;

    for (const recipe of recipes) {
      try {
        console.log(`🎨 Generating image for: ${recipe.title}`);
        
        const newImageUrl = await this.cloudinaryService.generateRecipeImage(
          recipe.title,
          recipe.ingredients as string[],
          recipe.country || 'International'
        );

        await this.prisma.recipe.update({
          where: { id: recipe.id },
          data: { imageUrl: newImageUrl },
        });

        updated++;
        console.log(`✅ Updated: ${recipe.title}`);
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
      } catch (error) {
        failed++;
        console.error(`❌ Failed to update ${recipe.title}:`, error.message);
      }
    }

    console.log(`🎉 ${category} update completed: ${updated} updated, ${failed} failed`);
    return { updated, failed };
  }

  /**
   * Update a single recipe image
   */
  async updateSingleRecipeImage(recipeId: string): Promise<boolean> {
    try {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: recipeId },
        select: {
          id: true,
          title: true,
          ingredients: true,
          country: true,
          imageUrl: true,
        },
      });

      if (!recipe) {
        throw new Error('Recipe not found');
      }

      console.log(`🎨 Generating image for: ${recipe.title}`);
      
      const newImageUrl = await this.cloudinaryService.generateRecipeImage(
        recipe.title,
        recipe.ingredients as string[],
        recipe.country || 'International'
      );

      await this.prisma.recipe.update({
        where: { id: recipe.id },
        data: { imageUrl: newImageUrl },
      });

      console.log(`✅ Updated: ${recipe.title}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to update recipe ${recipeId}:`, error.message);
      return false;
    }
  }

  /**
   * Get statistics about recipe images
   */
  async getImageStats(): Promise<{
    total: number;
    placeholder: number;
    aiGenerated: number;
    byCategory: Record<string, { total: number; placeholder: number; aiGenerated: number }>;
  }> {
    const total = await this.prisma.recipe.count();
    
    const placeholder = await this.prisma.recipe.count({
      where: {
        OR: [
          { imageUrl: { contains: 'dummyimage.com' } },
          { imageUrl: { contains: 'placeholder' } },
          { imageUrl: { contains: 'via.placeholder' } },
        ],
      },
    });

    const aiGenerated = total - placeholder;

    // Get stats by category
    const categories = await this.prisma.recipe.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const byCategory: Record<string, { total: number; placeholder: number; aiGenerated: number }> = {};

    for (const category of categories) {
      const categoryTotal = category._count.id;
      const categoryPlaceholder = await this.prisma.recipe.count({
        where: {
          category: category.category,
          OR: [
            { imageUrl: { contains: 'dummyimage.com' } },
            { imageUrl: { contains: 'placeholder' } },
            { imageUrl: { contains: 'via.placeholder' } },
          ],
        },
      });
      
      byCategory[category.category] = {
        total: categoryTotal,
        placeholder: categoryPlaceholder,
        aiGenerated: categoryTotal - categoryPlaceholder,
      };
    }

    return {
      total,
      placeholder,
      aiGenerated,
      byCategory,
    };
  }
}
