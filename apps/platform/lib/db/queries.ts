import { db } from './index';
import { eq, and, or, desc, asc, like, ilike, inArray, count, gte, lte } from 'drizzle-orm';
import * as schema from './schema';

// Destructure schema items for easier access
const {
  users,
  courses,
  chapters,
  lessons,
  quizzes,
  questions,
  answers,
  enrollments,
  courseProgress,
  lessonProgress,
  quizAttempts,
  userAnswers,
} = schema;

// Re-export db for convenience
export { db };

// Re-export simplified schema for convenience
export {
  users,
  courses,
  chapters,
  lessons,
  quizzes,
  questions,
  answers,
  enrollments,
  courseProgress,
  lessonProgress,
  quizAttempts,
  userAnswers,
  // Types
  type User,
  type NewUser,
  type Course,
  type NewCourse,
  type Chapter,
  type NewChapter,
  type Lesson,
  type NewLesson,
  type Quiz,
  type NewQuiz,
  type Question,
  type NewQuestion,
  type Answer,
  type NewAnswer,
  type Enrollment,
  type NewEnrollment,
  type CourseProgress,
  type NewCourseProgress,
  type LessonProgress,
  type NewLessonProgress,
  type QuizAttempt,
  type NewQuizAttempt,
  type UserAnswer,
  type NewUserAnswer,
} from './schema';

// ========================================
// CORE QUERY HELPERS (Simplified)
// ========================================

// Users
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

// Courses
export const findCourseById = async (id: string) => {
  const result = await db.select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return result[0] || null;
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

export const countCourses = async (whereConditions: any = {}) => {
  let query = db.select({ count: count() }).from(courses);

  if (whereConditions.status) {
    query = query.where(eq(courses.status, whereConditions.status));
  }

  const result = await query;
  return result[0]?.count || 0;
};

export const createCourse = async (courseData: NewCourse) => {
  const result = await db.insert(courses)
    .values(courseData)
    .returning();
  return result[0];
};

export const createCourseWithSlug = async (courseData: Omit<NewCourse, 'slug'>) => {
  const baseSlug = courseData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Ensure unique slug
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    try {
      const result = await db.insert(courses)
        .values({ ...courseData, slug })
        .returning();
      return result[0];
    } catch (error: any) {
      if (error.code === '23505' && counter < 100) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      } else {
        throw error;
      }
    }
  }
};

// Chapters
export const findChapterById = async (id: string) => {
  const result = await db.select()
    .from(chapters)
    .where(eq(chapters.id, id))
    .limit(1);
  return result[0] || null;
};

export const findChaptersByCourseId = async (courseId: string) => {
  return await db.select()
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.order));
};

export const createChapter = async (chapterData: NewChapter) => {
  const result = await db.insert(chapters)
    .values(chapterData)
    .returning();
  return result[0];
};

// Lessons with Mux integration
export const findLessonById = async (id: string) => {
  const result = await db.select()
    .from(lessons)
    .where(eq(lessons.id, id))
    .limit(1);
  return result[0] || null;
};

export const findLessonsByChapterId = async (chapterId: string) => {
  return await db.select()
    .from(lessons)
    .where(eq(lessons.chapterId, chapterId))
    .orderBy(asc(lessons.position));
};

export const findPublishedLessonsByChapterId = async (chapterId: string) => {
  return await db.select()
    .from(lessons)
    .where(and(
      eq(lessons.chapterId, chapterId),
      eq(lessons.isPublished, true)
    ))
    .orderBy(asc(lessons.position));
};

export const createLesson = async (lessonData: NewLesson) => {
  const result = await db.insert(lessons)
    .values(lessonData)
    .returning();
  return result[0];
};

export const updateLesson = async (id: string, lessonData: Partial<NewLesson>) => {
  const result = await db.update(lessons)
    .set({ ...lessonData, updatedAt: new Date() })
    .where(eq(lessons.id, id))
    .returning();
  return result[0];
};

// Mux-specific functions
export const updateLessonMuxData = async (
  id: string,
  muxData: {
    muxAssetId?: string;
    muxPlaybackId?: string;
    muxUploadId?: string;
    muxStatus?: string;
    videoUrl?: string;
    videoDurationSeconds?: number;
  }
) => {
  const result = await db.update(lessons)
    .set({
      ...muxData,
      updatedAt: new Date()
    })
    .where(eq(lessons.id, id))
    .returning();
  return result[0];
};

export const findLessonsNeedingMuxProcessing = async () => {
  return await db.select()
    .from(lessons)
    .where(and(
      eq(lessons.contentType, 'video'),
      or(
        eq(lessons.muxStatus, 'preparing'),
        eq(lessons.muxStatus, 'errored'),
        eq(lessons.muxStatus, 'uploading')
      )
    ))
    .orderBy(asc(lessons.createdAt));
};

export const findLessonByMuxUploadId = async (uploadId: string) => {
  const result = await db.select()
    .from(lessons)
    .where(eq(lessons.muxUploadId, uploadId))
    .limit(1);
  return result[0] || null;
};

// Quizzes
export const findQuizById = async (id: string) => {
  const result = await db.select()
    .from(quizzes)
    .where(eq(quizzes.id, id))
    .limit(1);
  return result[0] || null;
};

export const findQuizzesByLessonId = async (lessonId: string) => {
  return await db.select()
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId));
};

export const createQuiz = async (quizData: NewQuiz) => {
  const result = await db.insert(quizzes)
    .values(quizData)
    .returning();
  return result[0];
};

// Questions and Answers (Properly Normalized)
export const findQuestionsByQuizId = async (quizId: string) => {
  return await db.select()
    .from(questions)
    .where(eq(questions.quizId, quizId))
    .orderBy(asc(questions.order));
};

export const findAnswersByQuestionId = async (questionId: string) => {
  return await db.select()
    .from(answers)
    .where(eq(answers.questionId, questionId))
    .orderBy(asc(answers.order));
};

export const createQuestion = async (questionData: NewQuestion) => {
  const result = await db.insert(questions)
    .values(questionData)
    .returning();
  return result[0];
};

export const createAnswer = async (answerData: NewAnswer) => {
  const result = await db.insert(answers)
    .values(answerData)
    .returning();
  return result[0];
};

export const createQuestionWithAnswers = async (
  questionData: NewQuestion,
  answersData: NewAnswer[]
) => {
  const [question] = await db.insert(questions)
    .values(questionData)
    .returning();

  const answersWithQuestionId = answersData.map(answer => ({
    ...answer,
    questionId: question.id,
  }));

  await db.insert(answers)
    .values(answersWithQuestionId);

  return { question, answers: answersWithQuestionId };
};

// Enrollments
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

export const findEnrollmentsByUserId = async (userId: string) => {
  return await db.select()
    .from(enrollments)
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt));
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

// Progress Tracking (Split into Course + Lesson)
export const findCourseProgress = async (userId: string, courseId: string) => {
  const result = await db.select()
    .from(courseProgress)
    .where(and(
      eq(courseProgress.userId, userId),
      eq(courseProgress.courseId, courseId)
    ))
    .limit(1);
  return result[0] || null;
};

export const findLessonProgress = async (userId: string, lessonId: string) => {
  const result = await db.select()
    .from(lessonProgress)
    .where(and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.lessonId, lessonId)
    ))
    .limit(1);
  return result[0] || null;
};

export const findLessonsProgressByCourseId = async (userId: string, courseId: string) => {
  return await db.select({
    lessonProgress,
    lesson: {
      id: lessons.id,
      title: lessons.title,
      chapterId: lessons.chapterId,
      order: lessons.order,
      duration: lessons.duration,
    }
  })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .where(and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.courseId, courseId)
    ))
    .orderBy(asc(lessons.order));
};

export const upsertCourseProgress = async (progressData: NewCourseProgress) => {
  const result = await db.insert(courseProgress)
    .values(progressData)
    .onConflictDoUpdate({
      target: [courseProgress.enrollmentId],
      set: {
        lessonsCompleted: progressData.lessonsCompleted,
        lessonsTotal: progressData.lessonsTotal,
        quizzesPassed: progressData.quizzesPassed,
        quizzesTotal: progressData.quizzesTotal,
        progressPercent: progressData.progressPercent,
        updatedAt: new Date(),
      }
    })
    .returning();
  return result[0];
};

export const upsertLessonProgress = async (progressData: NewLessonProgress) => {
  const result = await db.insert(lessonProgress)
    .values(progressData)
    .onConflictDoUpdate({
      target: [lessonProgress.enrollmentId, lessonProgress.lessonId],
      set: {
        status: progressData.status,
        videoPositionSeconds: progressData.videoPositionSeconds,
        timeSpentSeconds: progressData.timeSpentSeconds,
        startedAt: progressData.startedAt,
        completedAt: progressData.completedAt,
        updatedAt: new Date(),
      }
    })
    .returning();
  return result[0];
};

// Enhanced progress tracking functions
export const updateLessonVideoPosition = async (
  enrollmentId: string,
  lessonId: string,
  positionSeconds: number
) => {
  const result = await db.update(lessonProgress)
    .set({
      videoPositionSeconds: positionSeconds,
      updatedAt: new Date(),
    })
    .where(and(
      eq(lessonProgress.enrollmentId, enrollmentId),
      eq(lessonProgress.lessonId, lessonId)
    ))
    .returning();
  return result[0] || null;
};

export const markLessonCompleted = async (
  enrollmentId: string,
  lessonId: string,
  timeSpentSeconds?: number
) => {
  const result = await db.update(lessonProgress)
    .set({
      status: 'completed',
      completedAt: new Date(),
      timeSpentSeconds: timeSpentSeconds,
      updatedAt: new Date(),
    })
    .where(and(
      eq(lessonProgress.enrollmentId, enrollmentId),
      eq(lessonProgress.lessonId, lessonId)
    ))
    .returning();
  return result[0] || null;
};

export const initializeLessonProgress = async (
  enrollmentId: string,
  lessonId: string
) => {
  const result = await db.insert(lessonProgress)
    .values({
      enrollmentId,
      lessonId,
      status: 'not_started',
    })
    .onConflictDoNothing()
    .returning();
  return result[0] || null;
};

export const getCourseCompletionStats = async (courseId: string) => {
  const totalLessons = await db.select({ count: count() })
    .from(lessons)
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .where(and(
      eq(chapters.courseId, courseId),
      eq(lessons.isPublished, true)
    ));

  const totalQuizzes = await db.select({ count: count() })
    .from(quizzes)
    .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .where(and(
      eq(chapters.courseId, courseId),
      eq(quizzes.isPublished, true)
    ));

  return {
    totalLessons: totalLessons[0]?.count || 0,
    totalQuizzes: totalQuizzes[0]?.count || 0,
  };
};

// Quiz Attempts and User Answers
export const findQuizAttemptsByUser = async (userId: string, quizId?: string) => {
  let whereConditions = [eq(quizAttempts.userId, userId)];

  if (quizId) {
    whereConditions.push(eq(quizAttempts.quizId, quizId));
  }

  return await db.select()
    .from(quizAttempts)
    .where(and(...whereConditions))
    .orderBy(desc(quizAttempts.startedAt));
};

export const findUserAnswersByAttempt = async (attemptId: string) => {
  return await db.select({
    userAnswer: userAnswers,
    question: {
      id: questions.id,
      question: questions.question,
      type: questions.type,
      points: questions.points,
    },
    answer: {
      id: answers.id,
      answerText: answers.answerText,
      isCorrect: answers.isCorrect,
    }
  })
    .from(userAnswers)
    .leftJoin(questions, eq(userAnswers.questionId, questions.id))
    .leftJoin(answers, eq(userAnswers.answerId, answers.id))
    .where(eq(userAnswers.attemptId, attemptId));
};

export const createQuizAttempt = async (attemptData: NewQuizAttempt) => {
  const result = await db.insert(quizAttempts)
    .values(attemptData)
    .returning();
  return result[0];
};

export const createUserAnswer = async (answerData: NewUserAnswer) => {
  const result = await db.insert(userAnswers)
    .values(answerData)
    .returning();
  return result[0];
};

export const createUserAnswers = async (answersData: NewUserAnswer[]) => {
  const result = await db.insert(userAnswers)
    .values(answersData)
    .returning();
  return result;
};

// ========================================
// ANALYTICS (Simplified)
// ========================================

export const getUserCourseStats = async (userId: string) => {
  const enrollmentsData = await db.select({
    course: courses,
    enrollment: enrollments,
    courseProgress: courseProgress,
  })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(courseProgress, eq(courseProgress.enrollmentId, enrollments.id))
    .where(eq(enrollments.userId, userId));

  return enrollmentsData.map(({ course, enrollment, courseProgress }) => ({
    course,
    enrollment,
    progress: courseProgress,
  }));
};

export const getQuizPerformanceStats = async (userId: string, courseId?: string) => {
  let whereConditions = [eq(quizAttempts.userId, userId)];

  if (courseId) {
    whereConditions.push(eq(quizzes.courseId, courseId));
  }

  const attempts = await db.select({
    quizAttempt: quizAttempts,
    quiz: quizzes,
  })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .where(and(...whereConditions));

  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      passRate: 0,
      totalTimeSpent: 0,
      recentAttempts: [],
    };
  }

  const passedCount = attempts.filter(({ quizAttempt }) => quizAttempt.passed).length;
  const totalScore = attempts.reduce((sum, { quizAttempt }) => sum + quizAttempt.score, 0);
  const bestScore = Math.max(...attempts.map(({ quizAttempt }) => quizAttempt.score));
  const totalTimeSpent = attempts.reduce((sum, { quizAttempt }) => sum + (quizAttempt.timeSpent || 0), 0);

  return {
    totalAttempts: attempts.length,
    averageScore: totalScore / attempts.length,
    bestScore,
    passRate: (passedCount / attempts.length) * 100,
    totalTimeSpent,
    recentAttempts: attempts.slice(0, 10),
  };
};

// Progress Analytics Functions
export const getUserActivityStats = async (userId: string) => {
  const userEnrollments = await db.select({
    course,
    enrollment,
    courseProgress,
  })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(courseProgress, and(
      eq(courseProgress.userId, userId),
      eq(courseProgress.courseId, courses.id)
    ))
    .where(eq(enrollments.userId, userId));

  const userLessons = await db.select({
    lesson,
    chapter,
    course,
    progress: lessonProgress,
  })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .where(eq(lessonProgress.userId, userId));

  const userQuizzes = await db.select({
    quizAttempt: quizAttempts,
    quiz,
    course,
  })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .innerJoin(courses, eq(quizzes.courseId, courses.id))
    .where(eq(quizAttempts.userId, userId));

  // Calculate stats
  const totalTimeSpentSeconds = userLessons.reduce((sum, { progress }) => sum + (progress.timeSpentSeconds || 0), 0);
  const completedLessons = userLessons.filter(({ progress }) => progress.status === 'completed').length;
  const totalLessons = userLessons.length;
  const passedQuizzes = userQuizzes.filter(({ quizAttempt }) => quizAttempt.passed).length;
  const totalQuizzes = userQuizzes.length;
  const averageQuizScore = userQuizzes.length > 0
    ? userQuizzes.reduce((sum, { quizAttempt }) => sum + quizAttempt.score, 0) / userQuizzes.length
    : 0;

  // Calculate study streak (consecutive days with activity)
  const activityDates = new Set(
    userLessons
      .filter(({ progress }) => progress.completedAt)
      .map(({ progress }) => progress.completedAt!.toISOString().split('T')[0])
      .concat(
        userQuizzes.map(({ quizAttempt }) => quizAttempt.createdAt.toISOString().split('T')[0])
      )
  );

  const sortedDates = Array.from(activityDates).sort();
  let currentStreak = 0;
  let maxStreak = 0;

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const currentDate = new Date(sortedDates[i]);
    const nextDate = i < sortedDates.length - 1 ? new Date(sortedDates[i + 1]) : null;

    if (!nextDate || Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      break;
    }
  }

  return {
    totalCourses: userEnrollments.length,
    totalTimeSpentSeconds,
    totalTimeSpentHours: Math.round(totalTimeSpentSeconds / 3600 * 10) / 10,
    completedLessons,
    totalLessons,
    passedQuizzes,
    totalQuizzes,
    averageQuizScore: Math.round(averageQuizScore * 10) / 10,
    currentStreak,
    maxStreak,
    overallProgress: userEnrollments.length > 0
      ? Math.round(userEnrollments.reduce((sum, { courseProgress }) => sum + (courseProgress?.progressPercent || 0), 0) / userEnrollments.length)
      : 0,
  };
};

export const getUserLearningProgress = async (userId: string, courseId?: string) => {
  const enrollmentsQuery = db.select({
    course,
    enrollment,
    courseProgress,
    lessons: db.select({ count: count() })
      .from(lessons)
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(eq(chapters.courseId, courses.id))
      .as('lessonCount'),
    completedLessons: db.select({ count: count() })
      .from(lessonProgress)
      .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
      .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(and(
        eq(chapters.courseId, courses.id),
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.status, 'completed')
      ))
      .as('completedLessonCount'),
  })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(courseProgress, and(
      eq(courseProgress.userId, userId),
      eq(courseProgress.courseId, courses.id)
    ))
    .where(eq(enrollments.userId, userId));

  if (courseId) {
    enrollmentsQuery.where(eq(courses.id, courseId));
  }

  const courseData = await enrollmentsQuery;

  return courseData.map(({ course, enrollment, courseProgress, lessons, completedLessons }) => ({
    course,
    enrollment,
    progress: courseProgress,
    totalLessons: lessons.count || 0,
    completedLessons: completedLessons.count || 0,
    progressPercent: courseProgress?.progressPercent || 0,
    lessonsCompleted: courseProgress?.lessonsCompleted || 0,
    quizzesPassed: courseProgress?.quizzesPassed || 0,
    status: enrollment.status,
  }));
};

export const getQuizStats = async (userId: string) => {
  const quizData = await db.select({
    quizAttempt: quizAttempts,
    quiz,
    course,
  })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .innerJoin(courses, eq(quizzes.courseId, courses.id))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt));

  const totalQuizzes = quizData.length;
  const passedQuizzes = quizData.filter(({ quizAttempt }) => quizAttempt.passed).length;
  const averageScore = totalQuizzes > 0
    ? quizData.reduce((sum, { quizAttempt }) => sum + quizAttempt.score, 0) / totalQuizzes
    : 0;
  const totalTimeSpent = quizData.reduce((sum, { quizAttempt }) => sum + (quizAttempt.timeSpent || 0), 0);

  return {
    totalQuizzes,
    passedQuizzes,
    passRate: totalQuizzes > 0 ? Math.round((passedQuizzes / totalQuizzes) * 100) : 0,
    averageScore: Math.round(averageScore * 10) / 10,
    totalTimeSpentMinutes: Math.round(totalTimeSpent / 60 * 10) / 10,
    recentQuizzes: quizData.slice(0, 10),
  };
};

export const getWeeklyActivity = async (userId: string) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyLessons = await db.select({
    lesson,
    chapter,
    course,
    progress: lessonProgress,
  })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .where(and(
      eq(lessonProgress.userId, userId),
      gte(lessonProgress.createdAt, oneWeekAgo)
    ));

  const weeklyQuizzes = await db.select({
    quizAttempt: quizAttempts,
    quiz,
    course,
  })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .innerJoin(courses, eq(quizzes.courseId, courses.id))
    .where(and(
      eq(quizAttempts.userId, userId),
      gte(quizAttempts.createdAt, oneWeekAgo)
    ));

  const totalTimeSpent = weeklyLessons.reduce((sum, { progress }) => sum + (progress.timeSpentSeconds || 0), 0);
  const completedLessons = weeklyLessons.filter(({ progress }) => progress.status === 'completed').length;
  const totalQuestionsAnswered = weeklyQuizzes.reduce((sum, { quizAttempt }) => sum + (quizAttempt.questionsAnswered || 0), 0);

  // Group by day for activity heatmap
  const dailyActivity = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayLessons = weeklyLessons.filter(({ progress }) =>
      progress.createdAt.toISOString().split('T')[0] === dateStr
    ).length;

    const dayQuizzes = weeklyQuizzes.filter(({ quizAttempt }) =>
      quizAttempt.createdAt.toISOString().split('T')[0] === dateStr
    ).length;

    dailyActivity.push({
      date: dateStr,
      lessons: dayLessons,
      quizzes: dayQuizzes,
      total: dayLessons + dayQuizzes,
    });
  }

  return {
    totalTimeSpentMinutes: Math.round(totalTimeSpent / 60 * 10) / 10,
    totalTimeSpentHours: Math.round(totalTimeSpent / 3600 * 10) / 10,
    completedLessons,
    totalLessons: weeklyLessons.length,
    totalQuizzes: weeklyQuizzes.length,
    totalQuestionsAnswered,
    dailyActivity: dailyActivity.reverse(),
  };
};

export const getRecentProgress = async (userId: string) => {
  const recentLessons = await db.select({
    lesson,
    chapter,
    course,
    progress: lessonProgress,
  })
    .from(lessonProgress)
    .innerJoin(lessons, eq(lessonProgress.lessonId, lessons.id))
    .innerJoin(chapters, eq(lessons.chapterId, chapters.id))
    .innerJoin(courses, eq(chapters.courseId, courses.id))
    .where(and(
      eq(lessonProgress.userId, userId),
      eq(lessonProgress.status, 'completed')
    ))
    .orderBy(desc(lessonProgress.completedAt))
    .limit(10);

  const recentQuizzes = await db.select({
    quizAttempt: quizAttempts,
    quiz,
    course,
  })
    .from(quizAttempts)
    .innerJoin(quizzes, eq(quizAttempts.quizId, quizzes.id))
    .innerJoin(courses, eq(quizzes.courseId, courses.id))
    .where(eq(quizAttempts.userId, userId))
    .orderBy(desc(quizAttempts.createdAt))
    .limit(10);

  // Combine and sort by date
  const achievements = [
    ...recentLessons.map(({ lesson, chapter, course, progress }) => ({
      type: 'lesson',
      title: `Completed: ${lesson.title}`,
      description: `${course.title} - ${chapter.title}`,
      date: progress.completedAt || progress.createdAt,
      icon: 'BookOpen',
      score: null,
    })),
    ...recentQuizzes.map(({ quizAttempt, quiz, course }) => ({
      type: 'quiz',
      title: quizAttempt.passed ? `Quiz Passed: ${quiz.title}` : `Quiz Attempted: ${quiz.title}`,
      description: `${course.title} - Score: ${Math.round(quizAttempt.score)}%`,
      date: quizAttempt.createdAt,
      icon: 'Award',
      score: Math.round(quizAttempt.score),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 10);

  return achievements;
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

export const getCourseWithContent = async (courseId: string) => {
  const course = await findCourseById(courseId);
  if (!course) return null;

  const chaptersWithLessons = await db.select({
    chapter: chapters,
    lessons: db.select().from(lessons).where(eq(lessons.chapterId, chapters.id)).orderBy(asc(lessons.order)),
  })
    .from(chapters)
    .where(eq(chapters.courseId, courseId))
    .orderBy(asc(chapters.order));

  return {
    ...course,
    chapters: chaptersWithLessons,
  };
};

export const getLessonWithQuiz = async (lessonId: string) => {
  const lesson = await findLessonById(lessonId);
  if (!lesson) return null;

  const quizData = await db.select({
    quiz: quizzes,
    questions: db.select({
      question: questions,
      answers: db.select().from(answers).where(eq(answers.questionId, questions.id)).orderBy(asc(answers.order)),
    }).from(questions).where(eq(questions.quizId, quizzes.id)).orderBy(asc(questions.order)),
  })
    .from(quizzes)
    .where(eq(quizzes.lessonId, lessonId))
    .limit(1);

  return {
    ...lesson,
    quiz: quizData[0] || null,
  };
};