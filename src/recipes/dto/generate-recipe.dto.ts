import { IsArray, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class GenerateRecipeDto {
  @ApiProperty({
    description: 'List of ingredients to use in the recipe',
    example: ['chicken', 'rice', 'vegetables', 'garlic', 'soy sauce'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one ingredient is required' })
  @ArrayMaxSize(15, { message: 'Maximum 15 ingredients allowed' })
  @IsString({ each: true })
  ingredients: string[];

  @ApiPropertyOptional({
    description: 'Country/region for cuisine style (overrides user location from profile)',
    example: 'Italy',
    examples: {
      italy: {
        summary: 'Italian Cuisine',
        description: 'Generate Italian-style recipes',
        value: 'Italy'
      },
      japan: {
        summary: 'Japanese Cuisine', 
        description: 'Generate Japanese-style recipes',
        value: 'Japan'
      },
      mexico: {
        summary: 'Mexican Cuisine',
        description: 'Generate Mexican-style recipes', 
        value: 'Mexico'
      },
      india: {
        summary: 'Indian Cuisine',
        description: 'Generate Indian-style recipes',
        value: 'India'
      },
      usa: {
        summary: 'American Cuisine',
        description: 'Generate American-style recipes',
        value: 'United States'
      }
    }
  })
  @IsOptional()
  @IsString()
  country?: string;
}
