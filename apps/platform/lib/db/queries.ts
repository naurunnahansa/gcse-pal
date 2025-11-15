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