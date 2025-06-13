import { ApiProperty } from '@nestjs/swagger';
import { RecipeCategory } from '@prisma/client';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { RecipeItemDto } from './recipe-list-response.dto';

export class DailyRecipeResponseDto {
  @ApiProperty({ example: 'cuid123', description: 'Daily recipe ID' })
  id: string;

  @ApiProperty({ enum: RecipeCategory, example: 'BREAKFAST', description: 'Recipe category' })
  category: RecipeCategory;

  @ApiProperty({ example: '2025-01-06T12:00:00.000Z', description: 'When recipe was generated (user local time)' })
  generatedAt: Date;

  @ApiProperty({ example: '2025-01-06', description: 'Date in YYYY-MM-DD format' })
  generatedDate: string;

  @ApiProperty({ type: RecipeItemDto, description: 'Full recipe details' })
  recipe: RecipeItemDto;

  @ApiProperty({ example: 'Home', description: 'Location name where recipe was generated' })
  locationName: string;

  @ApiProperty({ example: 'Nigeria', description: 'Country for the location' })
  locationCountry: string;
}

export class DailyRecipesQueryDto {
  @ApiProperty({ example: '2025-01-06', description: 'Date to fetch recipes for (YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 'cuid123', description: 'Location ID to filter by', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ enum: RecipeCategory, example: 'BREAKFAST', description: 'Recipe category to filter by', required: false })
  @IsOptional()
  category?: RecipeCategory;

  @ApiProperty({ example: 10, description: 'Number of recipes to return', required: false })
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0, description: 'Number of recipes to skip', required: false })
  @IsOptional()
  offset?: number;
}

export class DailyRecipesListResponseDto {
  @ApiProperty({ type: [DailyRecipeResponseDto], description: 'Array of daily generated recipes' })
  recipes: DailyRecipeResponseDto[];

  @ApiProperty({ example: 45, description: 'Total number of recipes for the date/filters' })
  totalCount: number;

  @ApiProperty({ example: 10, description: 'Number of recipes returned' })
  limit: number;

  @ApiProperty({ example: 0, description: 'Number of recipes skipped' })
  offset: number;
} 