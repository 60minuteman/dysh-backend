import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from '../../subscription/subscription.service';

@Injectable()
export class RecipeLimitGuard implements CanActivate {
  constructor(private subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
    }

    const canGenerate = await this.subscriptionService.canGenerateRecipe(userId);

    if (!canGenerate.canGenerate) {
      throw new HttpException(
        {
          message: canGenerate.reason || 'Recipe generation limit reached',
          code: 'RECIPE_LIMIT_EXCEEDED',
          canGenerate: false,
        },
        HttpStatus.FORBIDDEN
      );
    }

    return true;
  }
}
