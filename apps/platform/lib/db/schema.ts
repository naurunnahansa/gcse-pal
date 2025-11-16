import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// ========================================
// ENUMS (Simplified - 7 total)
// ========================================

export const userRoleEnum = pgEnum('user_role', ['student', 'admin', 'teacher']);
export const subjectEnum = pgEnum('subject', ['mathematics', 'english', 'science', 'history', 'geography', 'other']);
export const levelEnum = pgEnum('level', ['gcse', 'igcse', 'a_level']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'paused', 'dropped']);
export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);

// ========================================
// CORE TABLES (13 tables total)
// ========================================

// 1. Users table - Clean user management
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    role: userRoleEnum('role').default('student'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: index('users_clerk_id_idx').on(table.clerkId),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// 2. Courses table - Enhanced course catalog
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    slug: text('slug').notNull().unique(),
    subject: subjectEnum('subject').notNull(),
    level: levelEnum('level').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    status: courseStatusEnum('status').default('draft'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    createdByIdx: index('courses_created_by_idx').on(table.createdBy),
    slugIdx: index('courses_slug_idx').on(table.slug),
    subjectIdx: index('courses_subject_idx').on(table.subject),
    levelIdx: index('courses_level_idx').on(table.level),
    statusIdx: index('courses_status_idx').on(table.status),
  })
);

// 3. Chapters table - Course organization
export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    order: integer('order').notNull(),
    duration: integer('duration').notNull(), // in minutes
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseIdIdx: index('chapters_course_id_idx').on(table.courseId),
    courseOrderIdx: uniqueIndex('chapters_course_order_idx').on(table.courseId, table.order),
  })
);

// Enums for content and quiz types
export const contentTypeEnum = pgEnum('content_type', ['video', 'text', 'mixed']);
export const quizStatusEnum = pgEnum('quiz_status', ['in_progress', 'completed']);

// 4. Lessons table - Lesson content with Mux video integration
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    position: integer('position').notNull(),
    contentType: contentTypeEnum('content_type').default('mixed'),
    videoUrl: text('video_url'),
    videoDurationSeconds: integer('video_duration_seconds'),
    markdownContent: text('markdown_content'),
    // Mux video platform integration
    muxAssetId: text('mux_asset_id'),
    muxPlaybackId: text('mux_playback_id'),
    muxUploadId: text('mux_upload_id'),
    muxStatus: text('mux_status'), // 'preparing', 'ready', 'errored'
    isPublished: boolean('is_published').default(false),
    isPreview: boolean('is_preview').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    chapterIdIdx: index('lessons_chapter_id_idx').on(table.chapterId),
    chapterPositionIdx: uniqueIndex('lessons_chapter_position_idx').on(table.chapterId, table.position),
    isPublishedIdx: index('lessons_is_published_idx').on(table.isPublished),
  })
);

// 5. Quizzes table - Enhanced assessments
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    timeLimitMinutes: integer('time_limit_minutes'),
    passingScore: integer('passing_score').default(70),
    maxAttempts: integer('max_attempts'),
    shuffleQuestions: boolean('shuffle_questions').default(false),
    showAnswers: boolean('show_answers').default(true),
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    lessonIdIdx: index('quizzes_lesson_id_idx').on(table.lessonId),
  })
);

// 6. Questions table - Enhanced quiz questions
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    questionText: text('question_text').notNull(),
    type: questionTypeEnum('type').notNull(),
    position: integer('position').notNull(),
    points: integer('points').default(1),
    explanation: text('explanation'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    quizIdIdx: index('questions_quiz_id_idx').on(table.quizId),
    quizPositionIdx: uniqueIndex('questions_quiz_position_idx').on(table.quizId, table.position),
  })
);

// 7. Answers table - Enhanced question options (PROPERLY NORMALIZED!)
export const answers = pgTable(
  'answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    answerText: text('answer_text').notNull(),
    isCorrect: boolean('is_correct').default(false),
    position: integer('position').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    questionIdIdx: index('answers_question_id_idx').on(table.questionId),
    questionPositionIdx: uniqueIndex('answers_question_position_idx').on(table.questionId, table.position),
  })
);

// 8. Enrollments table - User enrollments
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
    enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    lastActivityAt: timestamp('last_activity_at'),
    progress: real('progress').default(0), // 0-100 percentage
    status: enrollmentStatusEnum('status').default('active'),
  },
  (table) => ({
    userIdIdx: index('enrollments_user_id_idx').on(table.userId),
    courseIdIdx: index('enrollments_course_id_idx').on(table.courseId),
    userCourseIdx: uniqueIndex('enrollments_user_course_idx').on(table.userId, table.courseId),
  })
);

// 9. Course Progress table - Enhanced progress tracking
export const courseProgress = pgTable(
  'course_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonsCompleted: integer('lessons_completed').default(0),
    lessonsTotal: integer('lessons_total').default(0),
    quizzesPassed: integer('quizzes_passed').default(0),
    quizzesTotal: integer('quizzes_total').default(0),
    progressPercent: real('progress_percent').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    enrollmentIdIdx: uniqueIndex('course_progress_enrollment_id_idx').on(table.enrollmentId),
  })
);

// 10. Lesson Progress table - Enhanced lesson tracking
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    status: progressStatusEnum('status').default('not_started'),
    videoPositionSeconds: integer('video_position_seconds').default(0),
    timeSpentSeconds: integer('time_spent_seconds').default(0),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    enrollmentIdIdx: index('lesson_progress_enrollment_id_idx').on(table.enrollmentId),
    lessonIdIdx: index('lesson_progress_lesson_id_idx').on(table.lessonId),
    enrollmentLessonIdx: uniqueIndex('lesson_progress_enrollment_lesson_idx').on(table.enrollmentId, table.lessonId),
    statusIdx: index('lesson_progress_status_idx').on(table.status),
  })
);

// 11. Quiz Attempts table - Enhanced quiz tracking
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    quizId: uuid('quiz_id').notNull().references(() => quizzes.id, { onDelete: 'cascade' }),
    attemptNumber: integer('attempt_number').notNull(),
    score: integer('score').default(0),
    maxScore: integer('max_score').notNull(),
    percentage: real('percentage').default(0),
    passed: boolean('passed').default(false),
    status: quizStatusEnum('status').default('in_progress'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('quiz_attempts_user_id_idx').on(table.userId),
    quizIdIdx: index('quiz_attempts_quiz_id_idx').on(table.quizId),
    userQuizIdx: index('quiz_attempts_user_quiz_idx').on(table.userId, table.quizId),
    userQuizAttemptIdx: uniqueIndex('quiz_attempts_user_quiz_attempt_idx').on(table.userId, table.quizId, table.attemptNumber),
  })
);

// 12. User Answers table - Enhanced individual answers
export const userAnswers = pgTable(
  'user_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
    questionId: uuid('question_id').notNull().references(() => questions.id, { onDelete: 'cascade' }),
    selectedAnswerId: uuid('selected_answer_id').references(() => answers.id, { onDelete: 'set null' }), // For MCQ
    answerText: text('answer_text'), // For short answer/essay
    isCorrect: boolean('is_correct').default(false),
    pointsAwarded: integer('points_awarded').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    attemptIdIdx: index('user_answers_attempt_id_idx').on(table.attemptId),
    questionIdIdx: index('user_answers_question_id_idx').on(table.questionId),
  })
);

// ========================================
// TYPES
// ========================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type Answer = typeof answers.$inferSelect;
export type NewAnswer = typeof answers.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

export type CourseProgress = typeof courseProgress.$inferSelect;
export type NewCourseProgress = typeof courseProgress.$inferInsert;

export type LessonProgress = typeof lessonProgress.$inferSelect;
export type NewLessonProgress = typeof lessonProgress.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type NewUserAnswer = typeof userAnswers.$inferInsert;