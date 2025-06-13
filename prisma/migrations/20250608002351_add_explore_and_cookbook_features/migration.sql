-- CreateEnum
CREATE TYPE "ExploreCategory" AS ENUM ('TRENDING', 'THIRTY_MIN_MEALS', 'CHEFS_PICK', 'OCCASION', 'HEALTHY_LIGHT', 'COMFORT_FOOD', 'ONE_POT_MEALS');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "country" TEXT,
ADD COLUMN     "exploreCategory" "ExploreCategory",
ADD COLUMN     "generationCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "user_recipe_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "isLiked" BOOLEAN NOT NULL DEFAULT false,
    "isViewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_recipe_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_recipe_interactions_userId_recipeId_key" ON "user_recipe_interactions"("userId", "recipeId");

-- AddForeignKey
ALTER TABLE "user_recipe_interactions" ADD CONSTRAINT "user_recipe_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_recipe_interactions" ADD CONSTRAINT "user_recipe_interactions_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
