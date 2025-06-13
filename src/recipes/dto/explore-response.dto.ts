import { ApiProperty } from '@nestjs/swagger';

export class ExploreRecipeDto {
  @ApiProperty({
    description: 'Unique recipe ID',
    example: 'cmbmhbb2b000lsbv5tsj6etc2',
  })
  id: string;

  @ApiProperty({
    description: 'Recipe title',
    example: 'Traditional Italian Carbonara',
  })
  title: string;

  @ApiProperty({
    description: 'Cooking duration',
    example: '25 min',
  })
  duration: string;

  @ApiProperty({
    description: 'Estimated calories',
    example: '450 kcal',
  })
  calories: string;

  @ApiProperty({
    description: 'Recipe rating',
    example: '4.8',
  })
  rating: string;

  @ApiProperty({
    description: 'Recipe image URL',
    example: 'https://dummyimage.com/400x400/f0932b/ffffff&text=%F0%9F%8D%9D%20Traditional%20Italian',
  })
  imageUrl: string;

  @ApiProperty({
    description: 'Country/cuisine origin',
    example: 'Italy',
  })
  country: string;

  @ApiProperty({
    description: 'List of ingredients with measurements',
    example: [
      '400g spaghetti',
      '200g pancetta, diced',
      '4 large eggs',
      '100g Pecorino Romano cheese, grated',
      '2 cloves garlic, minced'
    ],
    type: [String],
  })
  ingredients: string[];

  @ApiProperty({
    description: 'Step-by-step cooking instructions',
    example: [
      'Cook spaghetti according to package directions until al dente',
      'In a large pan, cook pancetta until crispy',
      'Whisk eggs and cheese together in a bowl',
      'Combine hot pasta with pancetta and egg mixture',
      'Serve immediately with extra cheese'
    ],
    type: [String],
  })
  instructions: string[];

  @ApiProperty({
    description: 'Professional cooking tips and tricks',
    example: [
      'Remove pan from heat before adding egg mixture to prevent scrambling',
      'Use pasta water to achieve perfect sauce consistency',
      'Freshly grated cheese makes all the difference'
    ],
    type: [String],
  })
  proTips: string[];

  @ApiProperty({
    description: 'Whether user has liked this recipe',
    example: false,
  })
  isLiked: boolean;
}

export class ExploreResponseDto {
  @ApiProperty({
    description: 'Array of explore recipes for the requested category',
    type: [ExploreRecipeDto],
  })
  recipes: ExploreRecipeDto[];

  @ApiProperty({
    description: 'Category of the recipes',
    example: 'CHEFS_PICK',
  })
  category: string;
}

export class CookbookResponseDto {
  @ApiProperty({
    description: 'Array of recipes saved to user cookbook',
    type: [ExploreRecipeDto],
  })
  recipes: ExploreRecipeDto[];

  @ApiProperty({
    description: 'Total count of recipes in cookbook',
    example: 15,
  })
  totalCount: number;
} 