import { ApiProperty } from '@nestjs/swagger';

export class RecipeItemDto {
  @ApiProperty({
    description: 'Unique recipe ID',
    example: 'cmbmhbb2b000lsbv5tsj6etc2',
  })
  id: string;

  @ApiProperty({
    description: 'Recipe title',
    example: 'Baked Oatmeal Cups with Apple and Cinnamon',
  })
  title: string;

  @ApiProperty({
    description: 'Cooking duration',
    example: '50 min',
  })
  duration: string;

  @ApiProperty({
    description: 'Estimated calories',
    example: '250 kcal',
  })
  calories: string;

  @ApiProperty({
    description: 'Recipe rating',
    example: '4.2',
  })
  rating: string;

  @ApiProperty({
    description: 'Recipe image URL',
    example: 'https://dummyimage.com/400x400/f0932b/ffffff&text=%F0%9F%8D%BD%EF%B8%8F%20Baked%20Oatmeal%20Cups',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'List of ingredients with measurements',
    example: [
      '2 cups rolled oats',
      '1 apple, diced',
      '1 tsp cinnamon',
      '1/4 cup honey',
      '1 cup milk'
    ],
    type: [String],
  })
  ingredients: string[];

  @ApiProperty({
    description: 'Step-by-step cooking instructions',
    example: [
      'Preheat oven to 350°F (175°C)',
      'Mix oats, cinnamon, and diced apple in a bowl',
      'Add honey and milk, stir well',
      'Divide mixture into muffin cups',
      'Bake for 45-50 minutes until golden'
    ],
    type: [String],
  })
  instructions: string[];

  @ApiProperty({
    description: 'Professional cooking tips and tricks',
    example: [
      'Use tart apples like Granny Smith for better flavor balance',
      'Let cool for 5 minutes before removing from cups',
      'Can be made ahead and reheated for busy mornings'
    ],
    type: [String],
  })
  proTips: string[];
}

export class RecipeListResponseDto {
  @ApiProperty({
    description: 'Array of recipes for the requested category',
    type: [RecipeItemDto],
  })
  recipes: RecipeItemDto[];
} 