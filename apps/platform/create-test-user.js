const { db, users } = require('./lib/db/queries');
const { eq } = require('drizzle-orm');

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUsers = await db.select()
      .from(users)
      .where(eq(users.clerkId, 'test-user'))
      .limit(1);

    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
      console.log('Test user already exists:', user);
    } else {
      // Create test user with preferences in consolidated schema
      const insertResult = await db.insert(users)
        .values({
          clerkId: 'test-user',
          email: 'test@example.com',
          name: 'Test User',
          role: 'student',
          preferences: {
            theme: 'light',
            emailNotifications: true,
            pushNotifications: true,
            studyReminders: true,
            deadlineReminders: true,
            dailyGoal: 60, // 60 minutes per day
          }
        })
        .returning();

      user = insertResult[0];
      console.log('Created test user:', user);
    }

    console.log('✅ Test user created successfully!');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createTestUser();