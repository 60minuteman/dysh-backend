import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ExploreService } from '../recipes/explore.service';
import { ExploreCategory } from '@prisma/client';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'LOG' | 'ERROR' | 'WARN' | 'DEBUG';
  message: string;
  context?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userAgent?: string;
}

@Injectable()
export class AdminService {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep only last 1000 logs

  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
    private exploreService: ExploreService,
  ) {}

  // Log capture methods
  addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const logEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(logEntry); // Add to beginning for newest first

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  getLogs(limit = 100) {
    return {
      logs: this.logs.slice(0, limit),
      total: this.logs.length,
      maxLogs: this.maxLogs,
    };
  }

  clearLogs() {
    this.logs = [];
    return { success: true, message: 'Logs cleared successfully' };
  }

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

  async getRecipes(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    
    // Build search filter
    const searchFilter = search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { country: { contains: search, mode: 'insensitive' as const } },
        { duration: { contains: search, mode: 'insensitive' as const } },
        { calories: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {};

    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where: searchFilter,
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
      this.prisma.recipe.count({ where: searchFilter }),
    ]);

    return {
      recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      search,
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

  async generateExploreRecipes(
    category: string,
    count: number,
    countries?: string[],
    mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER'
  ) {
    const categoryMap = {
      'trending': ExploreCategory.TRENDING,
      'thirty-min-meals': ExploreCategory.THIRTY_MIN_MEALS,
      'chefs-pick': ExploreCategory.CHEFS_PICK,
      'occasion': ExploreCategory.OCCASION,
      'healthy-light': ExploreCategory.HEALTHY_LIGHT,
      'comfort-food': ExploreCategory.COMFORT_FOOD,
      'one-pot-meals': ExploreCategory.ONE_POT_MEALS,
    };

    const exploreCategory = categoryMap[category];
    if (!exploreCategory) {
      throw new Error(`Invalid category: ${category}`);
    }

    return this.exploreService.adminGenerateExploreRecipes(
      exploreCategory,
      count,
      countries,
      mealType
    );
  }

  async getExploreRecipeStats() {
    const stats = await Promise.all([
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.TRENDING } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.THIRTY_MIN_MEALS } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.CHEFS_PICK } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.OCCASION } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.HEALTHY_LIGHT } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.COMFORT_FOOD } }),
      this.prisma.recipe.count({ where: { exploreCategory: ExploreCategory.ONE_POT_MEALS } }),
    ]);

    return {
      trending: stats[0],
      'thirty-min-meals': stats[1],
      'chefs-pick': stats[2],
      occasion: stats[3],
      'healthy-light': stats[4],
      'comfort-food': stats[5],
      'one-pot-meals': stats[6],
      total: stats.reduce((sum, count) => sum + count, 0),
    };
  }
} 