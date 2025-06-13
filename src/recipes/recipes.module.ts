import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { RecipesController } from './recipes.controller';
import { ExploreController, CookbookController } from './explore.controller';
import { LocationController } from './location.controller';
import { DailyRecipeController } from './daily-recipe.controller';
import { RecipesService } from './recipes.service';
import { ExploreService } from './explore.service';
import { LocationService } from './location.service';
import { DailyRecipeService } from './daily-recipe.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    PrismaModule, 
    CommonModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [
    RecipesController, 
    ExploreController, 
    CookbookController,
    LocationController,
    DailyRecipeController,
  ],
  providers: [
    RecipesService, 
    ExploreService,
    LocationService,
    DailyRecipeService,
  ],
  exports: [
    RecipesService, 
    ExploreService,
    LocationService,
    DailyRecipeService,
  ],
})
export class RecipesModule {}
