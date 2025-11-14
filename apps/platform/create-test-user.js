const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Create test user
    const user = await prisma.user.upsert({
      where: { clerkId: 'test-user' },
      update: {},
      create: {
        clerkId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        role: 'student',
      },
    });

    console.log('Created test user:', user);

    // Create user settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        dailyGoal: 60, // 60 minutes per day
        notificationsEnabled: true,
        theme: 'light',
      },
    });

    console.log('Created user settings:', settings);

    console.log('✅ Test user created successfully!');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();