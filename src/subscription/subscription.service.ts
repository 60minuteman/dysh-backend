import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if user can generate recipes
   * Rules:
   * 1. New users get 1 free recipe during onboarding
   * 2. After that, they need an active subscription (weekly/monthly/yearly)
   */
  async canGenerateRecipe(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Check if user has used their free recipe
    if (!user.freeRecipeUsed) {
      return { canGenerate: true };
    }

    // Check if user has an active subscription
    if (user.subscription && this.isSubscriptionActive(user.subscription)) {
      return { canGenerate: true };
    }

    return { 
      canGenerate: false, 
      reason: 'You have used your free recipe. Please subscribe to continue generating recipes.' 
    };
  }

  /**
   * Mark user's free recipe as used
   */
  async useFreeRecipe(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        freeRecipeUsed: true,
        recipeGenerationCount: { increment: 1 }
      },
    });
  }

  /**
   * Increment recipe generation count for subscribed users
   */
  async incrementRecipeCount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        recipeGenerationCount: { increment: 1 }
      },
    });
  }

  /**
   * Check if subscription is active
   */
  private isSubscriptionActive(subscription: any): boolean {
    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    const now = new Date();
    return subscription.endDate > now;
  }

  /**
   * Create a new subscription for user
   */
  async createSubscription(
    userId: string,
    plan: SubscriptionPlan,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<any> {
    const startDate = new Date();
    const endDate = this.calculateEndDate(startDate, plan);

    return this.prisma.userSubscription.create({
      data: {
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        stripeCustomerId,
        stripeSubscriptionId,
      },
    });
  }

  /**
   * Update subscription status
   */
  async updateSubscriptionStatus(
    userId: string,
    status: SubscriptionStatus
  ): Promise<any> {
    return this.prisma.userSubscription.update({
      where: { userId },
      data: { status },
    });
  }

  /**
   * Get user's subscription details
   */
  async getUserSubscription(userId: string): Promise<any> {
    return this.prisma.userSubscription.findUnique({
      where: { userId },
    });
  }

  /**
   * Calculate subscription end date based on plan
   */
  private calculateEndDate(startDate: Date, plan: SubscriptionPlan): Date {
    const endDate = new Date(startDate);
    
    switch (plan) {
      case SubscriptionPlan.WEEKLY:
        endDate.setDate(endDate.getDate() + 7);
        break;
      case SubscriptionPlan.MONTHLY:
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case SubscriptionPlan.YEARLY:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Invalid subscription plan: ${plan}`);
    }
    
    return endDate;
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    
    if (!subscription) {
      return false;
    }

    return this.isSubscriptionActive(subscription);
  }
}
