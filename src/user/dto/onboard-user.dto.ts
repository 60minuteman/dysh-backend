import {
  IsString,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  Length,
  Min,
  Max,
  IsIn,
  Matches,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DietaryPreference {
  NONE = 'none',
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  PESCATARIAN = 'pescatarian',
  GLUTEN_FREE = 'gluten-free',
  KETO = 'keto',
}

export enum SubscriptionPlan {
  YEARLY = 'yearly',
  MONTHLY = 'monthly',
  SKIP = 'skip',
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export class LocationDto {
  @ApiPropertyOptional({
    description: 'Latitude in decimal degrees',
    minimum: -90,
    maximum: 90,
    example: 6.5244,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude in decimal degrees',
    minimum: -180,
    maximum: 180,
    example: 3.3792,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'User-friendly region name',
    minLength: 1,
    maxLength: 100,
    example: 'Lagos, Nigeria',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  region?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    minLength: 1,
    maxLength: 50,
    example: 'Nigeria',
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  country?: string;

  @ApiPropertyOptional({
    description: 'ISO 3166-1 alpha-2 country code',
    minLength: 2,
    maxLength: 2,
    example: 'NG',
    pattern: '^[A-Z]{2}$',
  })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, { message: 'Country code must be ISO 3166-1 alpha-2 format (e.g., NG, US)' })
  country_code?: string;

  @ApiProperty({
    description: 'Whether user granted location access permission',
    example: true,
  })
  @IsBoolean()
  permission_granted: boolean;
}

export class DeviceInfoDto {
  @ApiPropertyOptional({
    description: 'Platform the app is running on',
    enum: Platform,
    example: Platform.IOS,
  })
  @IsOptional()
  @IsEnum(Platform)
  platform?: Platform;

  @ApiPropertyOptional({
    description: 'Application version',
    minLength: 1,
    maxLength: 20,
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  app_version?: string;

  @ApiPropertyOptional({
    description: 'Unique device identifier',
    minLength: 1,
    maxLength: 100,
    example: 'device123',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  device_id?: string;
}

export class OnboardUserDto {
  @ApiProperty({
    description: 'User dietary preference',
    enum: DietaryPreference,
    example: DietaryPreference.VEGETARIAN,
  })
  @IsEnum(DietaryPreference)
  dietary_preference: DietaryPreference;

  @ApiProperty({
    description: 'User location information',
    type: LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'List of user preferred ingredients (4-10 items)',
    type: [String],
    minItems: 4,
    maxItems: 10,
    example: ['tomato', 'onion', 'pepper', 'rice'],
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(2, 50, { each: true })
  @Matches(/^[a-zA-Z0-9\s\-]+$/, { each: true, message: 'Ingredients can only contain letters, numbers, spaces, and hyphens' })
  @ArrayUnique((ingredient: string) => ingredient.toLowerCase().trim())
  ingredients: string[];

  @ApiProperty({
    description: 'Preferred number of servings',
    enum: [2, 4, 6],
    example: 4,
  })
  @IsNumber()
  @IsIn([2, 4, 6])
  preferred_servings: number;

  @ApiPropertyOptional({
    description: 'Subscription plan choice',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.MONTHLY,
  })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscription_plan?: SubscriptionPlan;

  @ApiProperty({
    description: 'Onboarding flow version for tracking changes',
    minLength: 1,
    maxLength: 10,
    example: '1.0',
  })
  @IsString()
  @Length(1, 10)
  onboarding_version: string;

  @ApiPropertyOptional({
    description: 'Device information for analytics',
    type: DeviceInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  device_info?: DeviceInfoDto;
} 