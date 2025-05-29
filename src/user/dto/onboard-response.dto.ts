import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DietaryPreference, SubscriptionPlan } from './onboard-user.dto';

export class OnboardingProfileDto {
  @ApiProperty({
    description: 'Unique profile identifier',
    example: 'clp123abc456def789',
  })
  id: string;

  @ApiProperty({
    description: 'User dietary preference',
    enum: DietaryPreference,
    example: DietaryPreference.VEGETARIAN,
  })
  dietary_preference: DietaryPreference;

  @ApiProperty({
    description: 'Normalized list of user ingredients',
    type: [String],
    example: ['tomato', 'onion', 'pepper', 'rice'],
  })
  ingredients: string[];

  @ApiProperty({
    description: 'Preferred number of servings',
    enum: [2, 4, 6],
    example: 4,
  })
  preferred_servings: number;

  @ApiPropertyOptional({
    description: 'Selected subscription plan',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.MONTHLY,
  })
  subscription_plan?: SubscriptionPlan;

  @ApiProperty({
    description: 'Onboarding flow version',
    example: '1.0',
  })
  onboarding_version: string;

  @ApiProperty({
    description: 'Whether onboarding is complete',
    example: true,
  })
  is_onboarding_complete: boolean;
}

export class OnboardingSuccessResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Onboarding completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User profile data',
    type: OnboardingProfileDto,
  })
  profile: OnboardingProfileDto;
}

export class ValidationErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Array of validation error messages',
    type: [String],
    example: [
      'dietary_preference must be one of the following values: none, vegetarian, vegan, pescatarian, gluten-free, keto',
      'ingredients must contain at least 4 elements',
    ],
  })
  message: string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;
}

export class ConflictErrorDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 409,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'User has already completed onboarding',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Conflict',
  })
  error: string;
} 