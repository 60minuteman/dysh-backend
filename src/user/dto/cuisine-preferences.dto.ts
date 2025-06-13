import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CuisinePreferencesResponseDto {
  @ApiProperty({ 
    example: ['nigerian', 'mediterranean'], 
    description: 'User cuisine preferences' 
  })
  preferences: string[];
}

export class AddCuisinePreferenceDto {
  @ApiProperty({ 
    example: 'italian', 
    description: 'Cuisine type to add' 
  })
  @IsString()
  @IsNotEmpty()
  cuisine: string;
}

export class NextMealResponseDto {
  @ApiProperty({ 
    example: 'lunch', 
    description: 'Next meal type' 
  })
  nextMealType: string;

  @ApiProperty({ 
    example: 35, 
    description: 'Minutes until next meal' 
  })
  minutesUntil: number;

  @ApiProperty({ 
    example: 'Lunch in 35:00', 
    description: 'Display text for countdown' 
  })
  displayText: string;
} 