import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async getDashboardStats() {
    const [totalUsers, totalRecipes, completedOnboarding, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.recipe.count(),
      this.prisma.userProfile.count({ where: { isOnboardingComplete: true } }),
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalRecipes,
      completedOnboarding,
      recentUsers,
      completionRate: totalUsers > 0 ? Math.round((completedOnboarding / totalUsers) * 100) : 0,
    };
  }

  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          profile: true,
          _count: {
            select: {
              recipeInteractions: true,
              dailyRecipes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getRecipes(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              userInteractions: true,
              dailyRecipes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.recipe.count(),
    ]);

    return {
      recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async generateTestToken() {
    return this.authService.generateTestToken();
  }

  async getSystemHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
} 