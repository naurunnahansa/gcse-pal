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