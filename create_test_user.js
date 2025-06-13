const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔍 Checking for existing test user...');
    
    const existingUser = await prisma.user.findUnique({
      where: { id: 'clsnwls300000db0inegmrp65q' }
    });
    
    if (existingUser) {
      console.log('✅ Test user already exists:', existingUser.email);
      return existingUser;
    }
    
    console.log('👤 Creating test user...');
    
    const user = await prisma.user.create({
      data: {
        id: 'clsnwls300000db0inegmrp65q',
        email: 'testuser@example.com',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        isPro: true,
        profile: {
          create: {
            dietaryPreference: 'NONE',
            ingredients: ['chicken', 'rice', 'vegetables'],
            preferredServings: 4,
            onboardingVersion: '1.0',
            isOnboardingComplete: true,
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log('✅ Test user created successfully:', user.email);
    return user;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 