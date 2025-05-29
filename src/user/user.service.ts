import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardUserDto, DietaryPreference, SubscriptionPlan, Platform } from './dto/onboard-user.dto';
import { DietaryPreference as PrismaDietaryPreference, SubscriptionPlan as PrismaSubscriptionPlan, Platform as PrismaPlatform } from '../../generated/prisma';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private normalizeIngredient(ingredient: string): string {
    // Basic normalization rules
    const normalized = ingredient.toLowerCase().trim();
    
    // Simple pluralization handling
    const singularMappings: { [key: string]: string } = {
      'tomatoes': 'tomato',
      'potatoes': 'potato',
      'onions': 'onion',
      'carrots': 'carrot',
      'peppers': 'pepper',
      'mushrooms': 'mushroom',
      'eggs': 'egg',
      'apples': 'apple',
      'bananas': 'banana',
      'oranges': 'orange',
      // Add more as needed
    };

    return singularMappings[normalized] || normalized;
  }

  private validateAndNormalizeIngredients(ingredients: string[]): string[] {
    const normalized = ingredients.map(ingredient => this.normalizeIngredient(ingredient));
    
    // Check for duplicates after normalization
    const uniqueIngredients = [...new Set(normalized)];
    
    if (uniqueIngredients.length !== ingredients.length) {
      throw new BadRequestException('Duplicate ingredients found after normalization');
    }

    return uniqueIngredients;
  }

  private mapDietaryPreference(preference: DietaryPreference): PrismaDietaryPreference {
    const mapping: { [key in DietaryPreference]: PrismaDietaryPreference } = {
      [DietaryPreference.NONE]: PrismaDietaryPreference.NONE,
      [DietaryPreference.VEGETARIAN]: PrismaDietaryPreference.VEGETARIAN,
      [DietaryPreference.VEGAN]: PrismaDietaryPreference.VEGAN,
      [DietaryPreference.PESCATARIAN]: PrismaDietaryPreference.PESCATARIAN,
      [DietaryPreference.GLUTEN_FREE]: PrismaDietaryPreference.GLUTEN_FREE,
      [DietaryPreference.KETO]: PrismaDietaryPreference.KETO,
    };
    return mapping[preference];
  }

  private mapSubscriptionPlan(plan?: SubscriptionPlan): PrismaSubscriptionPlan | undefined {
    if (!plan) return undefined;
    
    const mapping: { [key in SubscriptionPlan]: PrismaSubscriptionPlan } = {
      [SubscriptionPlan.YEARLY]: PrismaSubscriptionPlan.YEARLY,
      [SubscriptionPlan.MONTHLY]: PrismaSubscriptionPlan.MONTHLY,
      [SubscriptionPlan.SKIP]: PrismaSubscriptionPlan.SKIP,
    };
    return mapping[plan];
  }

  private mapPlatform(platform?: Platform): PrismaPlatform | undefined {
    if (!platform) return undefined;
    
    const mapping: { [key in Platform]: PrismaPlatform } = {
      [Platform.IOS]: PrismaPlatform.IOS,
      [Platform.ANDROID]: PrismaPlatform.ANDROID,
      [Platform.WEB]: PrismaPlatform.WEB,
    };
    return mapping[platform];
  }

  async onboardUser(userId: string, onboardUserDto: OnboardUserDto) {
    // Check if user already has a profile (prevent re-onboarding)
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile && existingProfile.isOnboardingComplete) {
      throw new ConflictException('User has already completed onboarding');
    }

    // Validate and normalize ingredients
    const normalizedIngredients = this.validateAndNormalizeIngredients(onboardUserDto.ingredients);

    try {
      // Use transaction to ensure data consistency
      const result = await this.prisma.$transaction(async (prisma) => {
        // Upsert user profile
        const profile = await prisma.userProfile.upsert({
          where: { userId },
          update: {
            dietaryPreference: this.mapDietaryPreference(onboardUserDto.dietary_preference),
            ingredients: normalizedIngredients,
            preferredServings: onboardUserDto.preferred_servings,
            subscriptionPlan: this.mapSubscriptionPlan(onboardUserDto.subscription_plan),
            onboardingVersion: onboardUserDto.onboarding_version,
            isOnboardingComplete: true,
          },
          create: {
            userId,
            dietaryPreference: this.mapDietaryPreference(onboardUserDto.dietary_preference),
            ingredients: normalizedIngredients,
            preferredServings: onboardUserDto.preferred_servings,
            subscriptionPlan: this.mapSubscriptionPlan(onboardUserDto.subscription_plan),
            onboardingVersion: onboardUserDto.onboarding_version,
            isOnboardingComplete: true,
          },
        });

        // Handle location data
        if (onboardUserDto.location) {
          await prisma.location.upsert({
            where: { profileId: profile.id },
            update: {
              latitude: onboardUserDto.location.latitude,
              longitude: onboardUserDto.location.longitude,
              region: onboardUserDto.location.region,
              country: onboardUserDto.location.country,
              countryCode: onboardUserDto.location.country_code,
              permissionGranted: onboardUserDto.location.permission_granted,
            },
            create: {
              profileId: profile.id,
              latitude: onboardUserDto.location.latitude,
              longitude: onboardUserDto.location.longitude,
              region: onboardUserDto.location.region,
              country: onboardUserDto.location.country,
              countryCode: onboardUserDto.location.country_code,
              permissionGranted: onboardUserDto.location.permission_granted,
            },
          });
        }

        // Handle device info
        if (onboardUserDto.device_info) {
          await prisma.deviceInfo.create({
            data: {
              userId,
              platform: this.mapPlatform(onboardUserDto.device_info.platform),
              appVersion: onboardUserDto.device_info.app_version,
              deviceId: onboardUserDto.device_info.device_id,
            },
          });
        }

        return profile;
      });

      return {
        success: true,
        message: 'Onboarding completed successfully',
        profile: {
          id: result.id,
          dietary_preference: onboardUserDto.dietary_preference,
          ingredients: normalizedIngredients,
          preferred_servings: onboardUserDto.preferred_servings,
          subscription_plan: onboardUserDto.subscription_plan,
          onboarding_version: onboardUserDto.onboarding_version,
          is_onboarding_complete: true,
        },
      };
    } catch (error) {
      throw new BadRequestException('Failed to complete onboarding: ' + error.message);
    }
  }

  async createUser(email?: string) {
    return this.prisma.user.create({
      data: {
        email,
      },
    });
  }

  async getUserProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        location: true,
        user: {
          include: {
            deviceInfo: true,
          },
        },
      },
    });

    return profile;
  }
} 