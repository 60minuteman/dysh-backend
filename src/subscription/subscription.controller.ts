import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SubscriptionService } from './subscription.service';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

@ApiTags('subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user subscription status',
    description: 'Check if user can generate recipes and their subscription details',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        canGenerateRecipe: { type: 'boolean' },
        hasActiveSubscription: { type: 'boolean' },
        freeRecipeUsed: { type: 'boolean' },
        subscription: {
          type: 'object',
          nullable: true,
          properties: {
            plan: { type: 'string', enum: ['WEEKLY', 'MONTHLY', 'YEARLY'] },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        reason: { type: 'string', nullable: true },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async getSubscriptionStatus(@Request() req: any) {
    const userId = req.user.id;
    
    const canGenerate = await this.subscriptionService.canGenerateRecipe(userId);
    const hasActiveSubscription = await this.subscriptionService.hasActiveSubscription(userId);
    const subscription = await this.subscriptionService.getUserSubscription(userId);
    
    // Get user details for free recipe status
    const user = await this.subscriptionService['prisma'].user.findUnique({
      where: { id: userId },
      select: { freeRecipeUsed: true },
    });

    return {
      canGenerateRecipe: canGenerate.canGenerate,
      hasActiveSubscription,
      freeRecipeUsed: user?.freeRecipeUsed || false,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate,
      } : null,
      reason: canGenerate.reason,
    };
  }

  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new subscription',
    description: 'Create a subscription for the user (for testing purposes)',
  })
  @ApiResponse({
    status: 201,
    description: 'Subscription created successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async createSubscription(
    @Request() req: any,
    @Body() body: { plan: SubscriptionPlan; stripeCustomerId?: string; stripeSubscriptionId?: string }
  ) {
    const userId = req.user.id;
    const { plan, stripeCustomerId, stripeSubscriptionId } = body;

    // Check if user already has an active subscription
    const existingSubscription = await this.subscriptionService.getUserSubscription(userId);
    if (existingSubscription && existingSubscription.status === SubscriptionStatus.ACTIVE) {
      throw new HttpException('User already has an active subscription', HttpStatus.BAD_REQUEST);
    }

    const subscription = await this.subscriptionService.createSubscription(
      userId,
      plan,
      stripeCustomerId,
      stripeSubscriptionId
    );

    return {
      message: 'Subscription created successfully',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    };
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel user subscription',
    description: 'Cancel the user\'s active subscription',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelled successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
  })
  async cancelSubscription(@Request() req: any) {
    const userId = req.user.id;

    const subscription = await this.subscriptionService.updateSubscriptionStatus(
      userId,
      SubscriptionStatus.CANCELLED
    );

    return {
      message: 'Subscription cancelled successfully',
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
      },
    };
  }
}
