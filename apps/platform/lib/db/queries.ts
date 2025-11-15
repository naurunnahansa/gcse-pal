import { db } from './index';
import { eq, and, or, desc, asc, like, ilike, inArray, count, gte, lte } from 'drizzle-orm';
import * as schema from './schema';

// Re-export db for convenience
export { db };
// Re-export schema for convenience

// Re-export schema for convenience
export {
  users,
  courses,
  chapters,
  lessons,
  enrollments,
  progress,
  quizzes,
  questions,
  quizAttempts,
  quizAnswers,
  notes,
  tasks,
  studySessions,
  studyActivities,
  bookmarks,
  userSettings,
  courseTags,
  userFavorites,
  studyGroups,
  studyGroupMembers,
  studyGroupMessages,
  flashCards,
  flashCardReviews,
  evaluationStats,
  userItems,
  itemTags,
  activityLog,
  quizSubmissions,
  // Types
  type User,
  type NewUser,
  type Course,
  type NewCourse,
  type Chapter,
  type NewChapter,
  type Lesson,
  type NewLesson,
  type Enrollment,
  type NewEnrollment,
  type Progress,
  type NewProgress,
  type Quiz,
  type NewQuiz,
  type Question,
  type NewQuestion,
  type QuizAttempt,
  type NewQuizAttempt,
  type QuizAnswer,
  type NewQuizAnswer,
  type Note,
  type NewNote,
  type Task,
  type NewTask,
  type StudySession,
  type NewStudySession,
  type StudyActivity,
  type NewStudyActivity,
  type Bookmark,
  type NewBookmark,
  type UserSettings,
  type NewUserSettings,
  type CourseTag,
  type NewCourseTag,
  type UserFavorite,
  type NewUserFavorite,
  type StudyGroup,
  type NewStudyGroup,
  type StudyGroupMember,
  type NewStudyGroupMember,
  type StudyGroupMessage,
  type NewStudyGroupMessage,
  type FlashCard,
  type NewFlashCard,
  type FlashCardReview,
  type NewFlashCardReview,
  type EvaluationStats,
  type NewEvaluationStats,
  type UserItem,
  type NewUserItem,
  type ItemTag,
  type NewItemTag,
  type ActivityLog,
  type NewActivityLog,
  type QuizSubmission,
  type NewQuizSubmission,
} from './schema';

// Common query helpers
export const findUserByClerkId = async (clerkId: string) => {
  const result = await db.select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return result[0] || null;
};

export const findUserByEmail = async (email: string) => {
  const result = await db.select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] || null;
};

export const findCourseById = async (id: string) => {
  const result = await db.select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return result[0] || null;
};

export const findChapterById = async (id: string) => {
  const result = await db.select()
    .from(chapters)
    .where(eq(chapters.id, id))
    .limit(1);
  return result[0] || null;
};

export const findLessonById = async (id: string) => {
  const result = await db.select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);
  return result[0] || null;
};

export const findEnrollment = async (userId: string, courseId: string) => {
  const result = await db.select()
    .from(enrollments)
    .where(and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId)
    ))
    .limit(1);
  return result[0] || null;
};

export const countCourses = async (whereConditions: any = {}) => {
  let query = db.select({ count: count() }).from(courses);

  if (whereConditions.status) {
    query = query.where(eq(courses.status, whereConditions.status));
  }

  const result = await query;
  return result[0]?.count || 0;
};

export const findCoursesWithFilters = async (filters: {
  subject?: string;
  level?: string;
  difficulty?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const { subject, level, difficulty, search, status = 'published', page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;

  let whereConditions = [];

  if (status) {
    whereConditions.push(eq(courses.status, status));
  }

  if (subject && subject !== 'all') {
    whereConditions.push(eq(courses.subject, subject));
  }

  if (level && level !== 'all') {
    whereConditions.push(eq(courses.level, level));
  }

  if (difficulty && difficulty !== 'all') {
    whereConditions.push(eq(courses.difficulty, difficulty));
  }

  if (search) {
    whereConditions.push(
      or(
        ilike(courses.title, `%${search}%`),
        ilike(courses.description, `%${search}%`),
        ilike(courses.instructor, `%${search}%`)
      )
    );
  }

  const coursesData = await db.select()
    .from(courses)
    .where(and(...whereConditions))
    .orderBy(desc(courses.createdAt))
    .limit(limit)
    .offset(offset);

  return coursesData;
};

export const createUser = async (userData: NewUser) => {
  const result = await db.insert(users)
    .values(userData)
    .returning();
  return result[0];
};

export const updateUser = async (id: string, userData: Partial<NewUser>) => {
  const result = await db.update(users)
    .set({ ...userData, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return result[0];
};

export const createEnrollment = async (enrollmentData: NewEnrollment) => {
  const result = await db.insert(enrollments)
    .values(enrollmentData)
    .returning();
  return result[0];
};

export const updateEnrollmentProgress = async (userId: string, courseId: string, progress: number) => {
  const result = await db.update(enrollments)
    .set({
      progress,
      updatedAt: new Date(),
      completedAt: progress >= 100 ? new Date() : undefined
    })
    .where(and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courseId)
    ))
    .returning();
  return result[0];
};

// New helper functions for consolidated tables

// User Items (notes, tasks, bookmarks)
export const createUserItem = async (itemData: NewUserItem) => {
  const result = await db.insert(userItems)
    .values(itemData)
    .returning();
  return result[0];
};

export const findUserItems = async (userId: string, itemType?: string, lessonId?: string) => {
  let whereConditions = [eq(userItems.userId, userId)];

  if (itemType) {
    whereConditions.push(eq(userItems.itemType, itemType as any));
  }

  if (lessonId) {
    whereConditions.push(eq(userItems.lessonId, lessonId));
  }

  return await db.select()
    .from(userItems)
    .where(and(...whereConditions))
    .orderBy(desc(userItems.createdAt));
};

export const updateUserItem = async (id: string, itemData: Partial<NewUserItem>) => {
  const result = await db.update(userItems)
    .set({ ...itemData, updatedAt: new Date() })
    .where(eq(userItems.id, id))
    .returning();
  return result[0];
};

export const deleteUserItem = async (id: string) => {
  await db.delete(userItems)
    .where(eq(userItems.id, id));
};

// Item Tags
export const createItemTags = async (itemId: string, tags: string[]) => {
  if (tags.length === 0) return [];

  const tagData = tags.map(tag => ({
    itemId,
    tag: tag.toLowerCase().trim()
  }));

  const result = await db.insert(itemTags)
    .values(tagData)
    .returning();
  return result;
};

export const findItemTags = async (itemId: string) => {
  return await db.select()
    .from(itemTags)
    .where(eq(itemTags.itemId, itemId));
};

// Activity Log
export const createActivityLog = async (activityData: NewActivityLog) => {
  const result = await db.insert(activityLog)
    .values(activityData)
    .returning();
  return result[0];
};

export const findUserActivities = async (
  userId: string,
  activityType?: string,
  limit: number = 50,
  offset: number = 0
) => {
  let whereConditions = [eq(activityLog.userId, userId)];

  if (activityType) {
    whereConditions.push(eq(activityLog.activityType, activityType as any));
  }

  return await db.select()
    .from(activityLog)
    .where(and(...whereConditions))
    .orderBy(desc(activityLog.startedAt))
    .limit(limit)
    .offset(offset);
};

export const getUserActivityStats = async (userId: string, days: number = 30) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const activities = await db.select({
    totalDuration: activityLog.duration,
    activityType: activityLog.activityType
  })
    .from(activityLog)
    .where(and(
      eq(activityLog.userId, userId),
      gte(activityLog.startedAt, cutoffDate)
    ));

  return {
    totalActivities: activities.length,
    totalStudyTime: activities.reduce((sum, act) => sum + (act.totalDuration || 0), 0),
    activitiesByType: activities.reduce((acc, act) => {
      acc[act.activityType] = (acc[act.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

// Quiz Submissions
export const createQuizSubmission = async (submissionData: NewQuizSubmission) => {
  const result = await db.insert(quizSubmissions)
    .values(submissionData)
    .returning();
  return result[0];
};

export const findQuizSubmissions = async (userId: string, quizId?: string) => {
  let whereConditions = [eq(quizSubmissions.userId, userId)];

  if (quizId) {
    whereConditions.push(eq(quizSubmissions.quizId, quizId));
  }

  return await db.select()
    .from(quizSubmissions)
    .where(and(...whereConditions))
    .orderBy(desc(quizSubmissions.startedAt));
};

export const getQuizStats = async (userId: string, courseId?: string) => {
  let query = db.select({
    score: quizSubmissions.score,
    passed: quizSubmissions.passed,
    timeSpent: quizSubmissions.timeSpent,
    startedAt: quizSubmissions.startedAt,
    quizId: quizSubmissions.quizId
  })
    .from(quizSubmissions)
    .where(eq(quizSubmissions.userId, userId));

  if (courseId) {
    // This would need to join with quizzes table if courseId filtering is needed
  }

  const submissions = await query;

  if (submissions.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      passRate: 0,
      totalTimeSpent: 0
    };
  }

  const passedCount = submissions.filter(s => s.passed).length;
  const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
  const bestScore = Math.max(...submissions.map(s => s.score));
  const totalTimeSpent = submissions.reduce((sum, s) => sum + (s.timeSpent || 0), 0);

  return {
    totalAttempts: submissions.length,
    averageScore: totalScore / submissions.length,
    bestScore,
    passRate: (passedCount / submissions.length) * 100,
    totalTimeSpent
  };
};

// New helper functions for Phase 2 optimizations

// User Preferences (consolidated from user_settings)
export const updateUserPreferences = async (userId: string, preferences: Record<string, any>) => {
  const result = await db.update(users)
    .set({
      preferences,
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();
  return result[0];
};

export const getUserPreferences = async (userId: string) => {
  const userResults = await db.select({
    preferences: users.preferences
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return userResults[0]?.preferences || null;
};

export const updatePreferenceField = async (userId: string, field: string, value: any) => {
  const result = await db.update(users)
    .set({
      preferences: db.raw(`jsonb_set(coalesce(preferences, '{}'), '${field}', ?)`, [JSON.stringify(value)]),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId))
    .returning();
  return result[0];
};

// Study Groups (with consolidated members)
export const createStudyGroup = async (groupData: any) => {
  const { creatorId, name, description, courseId, isPrivate = false } = groupData;

  const result = await db.insert(studyGroups)
    .values({
      creatorId,
      name,
      description,
      courseId,
      isPrivate,
      members: [{
        user_id: creatorId,
        role: 'owner',
        joined_at: new Date().toISOString()
      }],
      memberCount: 1
    })
    .returning();
  return result[0];
};

export const addMemberToStudyGroup = async (groupId: string, userId: string, role: string = 'member') => {
  const groupResults = await db.select({ members: studyGroups.members, memberCount: studyGroups.memberCount })
    .from(studyGroups)
    .where(eq(studyGroups.id, groupId))
    .limit(1);

  if (groupResults.length === 0) {
    throw new Error('Study group not found');
  }

  const group = groupResults[0];
  const members = group.members || [];

  // Check if user is already a member
  const existingMember = members.find((m: any) => m.user_id === userId);
  if (existingMember) {
    throw new Error('User is already a member of this group');
  }

  const updatedMembers = [...members, {
    user_id: userId,
    role,
    joined_at: new Date().toISOString()
  }];

  const result = await db.update(studyGroups)
    .set({
      members: updatedMembers,
      memberCount: updatedMembers.length,
      updatedAt: new Date()
    })
    .where(eq(studyGroups.id, groupId))
    .returning();
  return result[0];
};

export const removeMemberFromStudyGroup = async (groupId: string, userId: string) => {
  const groupResults = await db.select({ members: studyGroups.members, creatorId: studyGroups.creatorId })
    .from(studyGroups)
    .where(eq(studyGroups.id, groupId))
    .limit(1);

  if (groupResults.length === 0) {
    throw new Error('Study group not found');
  }

  const group = groupResults[0];

  // Cannot remove the creator
  if (group.creatorId === userId) {
    throw new Error('Cannot remove the group creator');
  }

  const updatedMembers = group.members.filter((m: any) => m.user_id !== userId);

  const result = await db.update(studyGroups)
    .set({
      members: updatedMembers,
      memberCount: updatedMembers.length,
      updatedAt: new Date()
    })
    .where(eq(studyGroups.id, groupId))
    .returning();
  return result[0];
};

export const findUserStudyGroups = async (userId: string, courseId?: string) => {
  let whereConditions = [
    db.raw(`EXISTS (
      SELECT 1 FROM jsonb_array_elements(members) as member
      WHERE member->>'user_id' = ?
    )`, [userId])
  ];

  if (courseId) {
    whereConditions.push(eq(studyGroups.courseId, courseId));
  }

  return await db.select()
    .from(studyGroups)
    .where(and(...whereConditions))
    .orderBy(desc(studyGroups.createdAt));
};

// Advanced Analytics Functions
export const getUserLearningProgress = async (userId: string, courseId?: string) => {
  let query = db.select({
    courseId: courses.id,
    courseTitle: courses.title,
    enrollmentProgress: enrollments.progress,
    enrollmentStatus: enrollments.status,
    completedChapters: count(chapters.id),
    totalChapters: count(chapters.id).filter(),
    lastActivity: db.raw(`
      (
        SELECT MAX(started_at)
        FROM activity_log
        WHERE user_id = ? AND course_id = courses.id
      )
    `, [userId]),
    totalStudyTime: db.raw(`
      (
        SELECT COALESCE(SUM(duration), 0)
        FROM activity_log
        WHERE user_id = ? AND course_id = courses.id
      )
    `, [userId]),
    averageQuizScore: db.raw(`
      (
        SELECT COALESCE(AVG(score), 0)
        FROM quiz_submissions
        WHERE user_id = ? AND quiz_id IN (
          SELECT id FROM quizzes WHERE course_id = courses.id
        )
      )
    `, [userId])
  })
    .from(courses)
    .leftJoin(enrollments, and(
      eq(enrollments.userId, userId),
      eq(enrollments.courseId, courses.id)
    ))
    .leftJoin(chapters, eq(chapters.courseId, courses.id))
    .groupBy(courses.id, courses.title, enrollments.progress, enrollments.status);

  if (courseId) {
    query = query.where(eq(courses.id, courseId));
  } else {
    query = query.where(eq(enrollments.userId, userId)); // Only show enrolled courses
  }

  return await query.orderBy(courses.title);
};

export const getActivityInsights = async (userId: string, days: number = 30) => {
  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const activities = await db.select({
    activityType: activityLog.activityType,
    duration: activityLog.duration,
    date: db.raw(`DATE(started_at)`),
    data: activityLog.data
  })
    .from(activityLog)
    .where(and(
      eq(activityLog.userId, userId),
      gte(activityLog.startedAt, cutoffDate)
    ));

  return {
    totalActivities: activities.length,
    totalStudyTime: activities.reduce((sum, act) => sum + (act.duration || 0), 0),
    averageSessionTime: activities.length > 0
      ? activities.reduce((sum, act) => sum + (act.duration || 0), 0) / activities.length
      : 0,
    dailyStats: activities.reduce((acc, act) => {
      const date = act.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { studyTime: 0, activities: 0 };
      }
      acc[date].studyTime += act.duration || 0;
      acc[date].activities += 1;
      return acc;
    }, {} as Record<string, { studyTime: number; activities: number }>),
    activityBreakdown: activities.reduce((acc, act) => {
      acc[act.activityType] = (acc[act.activityType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

// Data Archival Functions
export const archiveOldActivities = async (daysOld: number = 365) => {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

  // This would be used with a proper archival table
  return await db.delete(activityLog)
    .where(lte(activityLog.startedAt, cutoffDate));
};

export const getArchiveStats = async () => {
  // Placeholder for archival statistics
  // In a real implementation, this would query the archive tables
  return {
    archivedActivities: 0,
    archivedItems: 0,
    archivedSubmissions: 0,
    lastArchiveDate: null
  };
};