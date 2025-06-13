import { PrismaClient, RecipeCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data
  await prisma.userCuisinePreference.deleteMany();
  await prisma.recipe.deleteMany();

  // Create breakfast recipes
  console.log('Creating breakfast recipes...');
  await prisma.recipe.createMany({
    data: [
      {
        title: 'Sweet Potato Porridge',
        duration: '30 min',
        calories: '320 kcal',
        rating: '4.5',
        imageUrl: 'https://images.unsplash.com/photo-1511909525232-61113c912358?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Jollof Rice',
        duration: '45 min',
        calories: '450 kcal',
        rating: '4.8',
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Nigerian Pancakes',
        duration: '20 min',
        calories: '280 kcal',
        rating: '4.3',
        imageUrl: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Akara (Bean Cakes)',
        duration: '25 min',
        calories: '200 kcal',
        rating: '4.6',
        imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Moi Moi',
        duration: '40 min',
        calories: '250 kcal',
        rating: '4.4',
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Fried Plantain & Eggs',
        duration: '15 min',
        calories: '380 kcal',
        rating: '4.7',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Yam Porridge',
        duration: '35 min',
        calories: '310 kcal',
        rating: '4.2',
        imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Bread & Tea',
        duration: '10 min',
        calories: '180 kcal',
        rating: '4.0',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Oatmeal with Fruits',
        duration: '15 min',
        calories: '240 kcal',
        rating: '4.5',
        imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400',
        category: RecipeCategory.BREAKFAST,
      },
      {
        title: 'Cornflakes & Milk',
        duration: '5 min',
        calories: '220 kcal',
        rating: '4.1',
        imageUrl: 'https://images.unsplash.com/photo-1559847844-d721426d6edc?w=400',
        category: RecipeCategory.BREAKFAST,
      },
    ],
  });

  // Create low-carb recipes
  console.log('Creating low-carb recipes...');
  await prisma.recipe.createMany({
    data: [
      {
        title: 'Boiled Plantain & Egg Sauce',
        duration: '30 min',
        calories: '320 kcal',
        rating: '4.5',
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400',
        category: RecipeCategory.LOW_CARB,
      },
      {
        title: 'Grilled Fish with Vegetables',
        duration: '25 min',
        calories: '280 kcal',
        rating: '4.7',
        imageUrl: 'https://images.unsplash.com/photo-1519708227418-c8947a927c43?w=400',
        category: RecipeCategory.LOW_CARB,
      },
      {
        title: 'Chicken Salad',
        duration: '15 min',
        calories: '250 kcal',
        rating: '4.4',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
        category: RecipeCategory.LOW_CARB,
      },
      {
        title: 'Pepper Soup',
        duration: '35 min',
        calories: '180 kcal',
        rating: '4.6',
        imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
        category: RecipeCategory.LOW_CARB,
      },
      {
        title: 'Steamed Vegetables',
        duration: '20 min',
        calories: '150 kcal',
        rating: '4.2',
        imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
        category: RecipeCategory.LOW_CARB,
      },
      {
        title: 'Cauliflower Rice',
        duration: '18 min',
        calories: '160 kcal',
        rating: '4.3',
        imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400',
        category: RecipeCategory.LOW_CARB,
      },
    ],
  });

  // Create high protein recipes
  console.log('Creating high protein recipes...');
  await prisma.recipe.createMany({
    data: [
      {
        title: 'Spicy Garlic Chicken Pasta with Beans',
        duration: '30 min',
        calories: '520 kcal',
        rating: '4.8',
        imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
      {
        title: 'Grilled Chicken Breast',
        duration: '25 min',
        calories: '350 kcal',
        rating: '4.6',
        imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
      {
        title: 'Beef & Bean Stew',
        duration: '45 min',
        calories: '480 kcal',
        rating: '4.7',
        imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
      {
        title: 'Fish & Chips (Baked)',
        duration: '35 min',
        calories: '400 kcal',
        rating: '4.5',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
      {
        title: 'Protein Smoothie Bowl',
        duration: '10 min',
        calories: '380 kcal',
        rating: '4.4',
        imageUrl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
      {
        title: 'Quinoa Chicken Bowl',
        duration: '40 min',
        calories: '450 kcal',
        rating: '4.6',
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
        category: RecipeCategory.HIGH_PROTEIN,
      },
    ],
  });

  // Create a sample user with cuisine preferences
  console.log('Creating sample user...');
  const sampleUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      isPro: true,
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      emailVerified: true,
    },
  });

  // Add cuisine preferences
  await prisma.userCuisinePreference.createMany({
    data: [
      { userId: sampleUser.id, cuisine: 'nigerian' },
      { userId: sampleUser.id, cuisine: 'mediterranean' },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created ${await prisma.recipe.count()} recipes`);
  console.log(`Created ${await prisma.user.count()} users`);
  console.log(`Created ${await prisma.userCuisinePreference.count()} cuisine preferences`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 