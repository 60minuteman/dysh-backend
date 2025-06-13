import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardUserDto, DietaryPreference, SubscriptionPlan, Platform } from './dto/onboard-user.dto';
import { DietaryPreference as PrismaDietaryPreference, SubscriptionPlan as PrismaSubscriptionPlan, Platform as PrismaPlatform } from '@prisma/client';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
import { CuisinePreferencesResponseDto, NextMealResponseDto } from './dto/cuisine-preferences.dto';

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

  async getCurrentUserProfile(userId: string): Promise<UserProfileResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        isPro: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      isPro: user.isPro,
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
    };
  }

  async getCuisinePreferences(userId: string): Promise<CuisinePreferencesResponseDto> {
    const preferences = await this.prisma.userCuisinePreference.findMany({
      where: { userId },
      select: { cuisine: true },
    });

    return {
      preferences: preferences.map(p => p.cuisine),
    };
  }

  async addCuisinePreference(userId: string, cuisine: string): Promise<CuisinePreferencesResponseDto> {
    // Check if preference already exists
    const existingPreference = await this.prisma.userCuisinePreference.findUnique({
      where: {
        userId_cuisine: {
          userId,
          cuisine: cuisine.toLowerCase(),
        },
      },
    });

    if (existingPreference) {
      throw new BadRequestException('Cuisine preference already exists');
    }

    // Add the preference
    await this.prisma.userCuisinePreference.create({
      data: {
        userId,
        cuisine: cuisine.toLowerCase(),
      },
    });

    // Return updated preferences
    return this.getCuisinePreferences(userId);
  }

  async removeCuisinePreference(userId: string, cuisine: string): Promise<CuisinePreferencesResponseDto> {
    // Remove the preference
    await this.prisma.userCuisinePreference.delete({
      where: {
        userId_cuisine: {
          userId,
          cuisine: cuisine.toLowerCase(),
        },
      },
    });

    // Return updated preferences
    return this.getCuisinePreferences(userId);
  }

  async getNextMeal(): Promise<NextMealResponseDto> {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Define meal times
    const mealTimes = [
      { name: 'breakfast', hour: 7 },   // 7:00 AM
      { name: 'lunch', hour: 12 },      // 12:00 PM
      { name: 'dinner', hour: 18 },     // 6:00 PM
    ];

    // Find the next meal
    let nextMeal = mealTimes.find(meal => meal.hour > currentHour);
    
    // If no meal found today, next meal is breakfast tomorrow
    if (!nextMeal) {
      nextMeal = { name: 'breakfast', hour: 7 };
      // Calculate minutes until tomorrow's breakfast
      const minutesUntilMidnight = (24 - currentHour) * 60 - now.getMinutes();
      const minutesFromMidnightToBreakfast = 7 * 60; // 7 AM
      const totalMinutes = minutesUntilMidnight + minutesFromMidnightToBreakfast;
      
      return {
        nextMealType: nextMeal.name,
        minutesUntil: totalMinutes,
        displayText: `${nextMeal.name.charAt(0).toUpperCase() + nextMeal.name.slice(1)} in ${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`,
      };
    }

    // Calculate minutes until next meal today
    const minutesUntilNextMeal = (nextMeal.hour - currentHour) * 60 - now.getMinutes();
    const hours = Math.floor(minutesUntilNextMeal / 60);
    const minutes = minutesUntilNextMeal % 60;

    return {
      nextMealType: nextMeal.name,
      minutesUntil: minutesUntilNextMeal,
      displayText: `${nextMeal.name.charAt(0).toUpperCase() + nextMeal.name.slice(1)} in ${hours}:${minutes.toString().padStart(2, '0')}`,
    };
  }
} 