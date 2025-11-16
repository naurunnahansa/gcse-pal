import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['student', 'admin', 'teacher']);
export const subjectEnum = pgEnum('subject', ['mathematics', 'english', 'science', 'history', 'geography', 'other']);
export const levelEnum = pgEnum('level', ['gcse', 'igcse', 'a_level']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'paused', 'dropped']);
export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'cancelled']);
export const activityTypeEnum = pgEnum('activity_type', ['watch_video', 'read_markdown', 'take_quiz', 'take_notes', 'practice_exercise']);
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);
export const studyTimeEnum = pgEnum('study_time', ['morning', 'afternoon', 'evening']);
export const groupRoleEnum = pgEnum('group_role', ['owner', 'moderator', 'member']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'file', 'link']);
export const reviewQualityEnum = pgEnum('review_quality', ['again', 'hard', 'good', 'easy']);

// New enums for consolidated tables
export const itemTypeEnum = pgEnum('item_type', ['note', 'task', 'bookmark']);
export const itemStatusEnum = pgEnum('item_status', ['active', 'completed', 'archived']);
export const activityTypeEnumNew = pgEnum('activity_type_new', ['study_session', 'video_watch', 'quiz_attempt', 'lesson_view']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkId: text('clerkId').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    role: userRoleEnum('role').default('student'),
    preferences: jsonb('preferences').$default({
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      studyReminders: true,
      deadlineReminders: true,
      dailyGoal: 60,
      preferredStudyTime: 'evening',
      studyDays: [1, 2, 3, 4, 5]
    }),
    createdAt: timestamp('createdAt').defaultNow().notNull(),
    updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  },
  (table) => ({
    clerkIdIdx: index('users_clerkId_idx').on(table.clerkId),
    emailIdx: index('users_email_idx').on(table.email),
    preferencesGinIdx: index('users_preferences_gin_idx').using('gin', table.preferences),
  })
);

// Courses table
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    subject: subjectEnum('subject').notNull(),
    level: levelEnum('level').default('gcse'),
    thumbnail: text('thumbnail'),
    instructor: text('instructor').notNull(),
    instructorId: text('instructor_id'),
    duration: integer('duration').notNull(), // in minutes
    difficulty: difficultyEnum('difficulty').default('beginner'),
    topics: text('topics').array().notNull().default([]),
    status: courseStatusEnum('status').default('draft'),
    enrollmentCount: integer('enrollment_count').default(0),
    rating: real('rating').default(0),
    price: real('price').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('courses_title_idx').on(table.title),
    subjectIdx: index('courses_subject_idx').on(table.subject),
    statusIdx: index('courses_status_idx').on(table.status),
    instructorIdIdx: index('courses_instructor_id_idx').on(table.instructorId),
  })
);

// Chapters table
export const chapters = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: text('course_id').notNull(),
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

// Lessons table
export const lessons = pgTable(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    chapterId: text('chapter_id').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    content: text('content'),
    // Enhanced content management with JSONB
    contentData: jsonb('content_data'), // Consolidated content with markdown, resources, etc.
    videoData: jsonb('video_data'), // Consolidated video data with Mux info, duration, etc.
    // Legacy fields for backward compatibility
    videoUrl: text('video_url'),
    videoDuration: integer('video_duration'), // in milliseconds
    markdownPath: text('markdown_path'),
    hasVideo: boolean('has_video').default(false),
    hasMarkdown: boolean('has_markdown').default(false),
    order: integer('order').notNull(),
    duration: integer('duration').notNull(), // in minutes
    isPublished: boolean('is_published').default(false),
    muxAssetId: text('mux_asset_id'),
    muxUploadId: text('mux_upload_id'),
    muxStatus: text('mux_status').default('none'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    chapterIdIdx: index('lessons_chapter_id_idx').on(table.chapterId),
    chapterOrderIdx: uniqueIndex('lessons_chapter_order_idx').on(table.chapterId, table.order),
    contentDataGinIdx: index('lessons_content_data_gin_idx').using('gin', table.contentData),
    videoDataGinIdx: index('lessons_video_data_gin_idx').using('gin', table.videoData),
  })
);

// Enrollments table
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
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

// Progress table
export const progress = pgTable(
  'progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
    chapterId: text('chapter_id'),
    lessonId: text('lesson_id'),
    status: progressStatusEnum('status').default('not_started'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent').default(0), // in minutes
    score: real('score'),
    lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('progress_user_id_idx').on(table.userId),
    courseIdIdx: index('progress_course_id_idx').on(table.courseId),
    userCourseUnique: uniqueIndex('progress_user_course_unique_idx').on(table.userId, table.courseId, table.chapterId, table.lessonId),
  })
);

// Quizzes table
export const quizzes = pgTable(
  'quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lessonId: text('lesson_id'),
    chapterId: text('chapter_id'),
    courseId: text('course_id'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    timeLimit: integer('time_limit'), // in minutes
    passingScore: real('passing_score').default(70), // percentage
    maxAttempts: integer('max_attempts').default(3),
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    lessonIdIdx: index('quizzes_lesson_id_idx').on(table.lessonId),
    chapterIdIdx: index('quizzes_chapter_id_idx').on(table.chapterId),
    courseIdIdx: index('quizzes_course_id_idx').on(table.courseId),
  })
);

// Questions table
export const questions = pgTable(
  'questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: text('quiz_id').notNull(),
    question: text('question').notNull(),
    type: questionTypeEnum('type').notNull(),
    options: text('options'), // For multiple choice (JSON string)
    correctAnswer: text('correct_answer').notNull(),
    explanation: text('explanation'),
    points: integer('points').default(1),
    order: integer('order').notNull(),
  },
  (table) => ({
    quizIdIdx: index('questions_quiz_id_idx').on(table.quizId),
  })
);

// Quiz attempts table
export const quizAttempts = pgTable(
  'quiz_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    quizId: text('quiz_id').notNull(),
    score: real('score').notNull(),
    passed: boolean('passed').notNull(),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    timeSpent: integer('time_spent').default(0), // in minutes
    attemptNumber: integer('attempt_number').notNull(),
  },
  (table) => ({
    userIdIdx: index('quiz_attempts_user_id_idx').on(table.userId),
    quizIdIdx: index('quiz_attempts_quiz_id_idx').on(table.quizId),
  })
);

// Quiz answers table
export const quizAnswers = pgTable(
  'quiz_answers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: text('attempt_id').notNull(),
    questionId: text('question_id').notNull(),
    userAnswer: text('user_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    points: integer('points').notNull(),
  },
  (table) => ({
    attemptIdIdx: index('quiz_answers_attempt_id_idx').on(table.attemptId),
    questionIdIdx: index('quiz_answers_question_id_idx').on(table.questionId),
  })
);

// Notes table
export const notes = pgTable(
  'notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id'),
    chapterId: text('chapter_id'),
    lessonId: text('lesson_id'),
    title: text('title').notNull(),
    content: text('content').notNull(), // Rich text content
    tags: text('tags').array().notNull().default([]),
    isPrivate: boolean('is_private').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notes_user_id_idx').on(table.userId),
    courseIdIdx: index('notes_course_id_idx').on(table.courseId),
    chapterIdIdx: index('notes_chapter_id_idx').on(table.chapterId),
    lessonIdIdx: index('notes_lesson_id_idx').on(table.lessonId),
  })
);

// Tasks table
export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    courseId: text('course_id'),
    chapterId: text('chapter_id'),
    lessonId: text('lesson_id'),
    priority: taskPriorityEnum('priority').default('medium'),
    status: taskStatusEnum('status').default('pending'),
    dueDate: timestamp('due_date'),
    completedAt: timestamp('completed_at'),
    tags: text('tags').array().notNull().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('tasks_user_id_idx').on(table.userId),
    statusIdx: index('tasks_status_idx').on(table.status),
  })
);

// Study sessions table
export const studySessions = pgTable(
  'study_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id'),
    lessonId: text('lesson_id'),
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    duration: integer('duration'), // in minutes
    pagesRead: integer('pages_read'),
    videosWatched: integer('videos_watched'),
    notes: text('notes'),
  },
  (table) => ({
    userIdIdx: index('study_sessions_user_id_idx').on(table.userId),
    courseIdIdx: index('study_sessions_course_id_idx').on(table.courseId),
    lessonIdIdx: index('study_sessions_lesson_id_idx').on(table.lessonId),
  })
);

// Study activities table
export const studyActivities = pgTable(
  'study_activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: text('session_id').notNull(),
    type: activityTypeEnum('type').notNull(),
    resourceId: text('resource_id').notNull(), // lessonId, quizId, etc.
    startTime: timestamp('start_time').defaultNow().notNull(),
    endTime: timestamp('end_time'),
    duration: integer('duration'), // in minutes
    data: jsonb('data'), // Additional activity-specific data
  },
  (table) => ({
    sessionIdIdx: index('study_activities_session_id_idx').on(table.sessionId),
    typeIdx: index('study_activities_type_idx').on(table.type),
  })
);

// Bookmarks table
export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id'),
    chapterId: text('chapter_id'),
    lessonId: text('lesson_id'),
    timestamp: integer('timestamp'), // For video bookmarks
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('bookmarks_user_id_idx').on(table.userId),
    userResourceIdx: uniqueIndex('bookmarks_user_resource_idx').on(table.userId, table.courseId, table.chapterId, table.lessonId),
  })
);

// User settings table
export const userSettings = pgTable(
  'user_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    theme: themeEnum('theme').default('light'),
    emailNotifications: boolean('email_notifications').default(true),
    pushNotifications: boolean('push_notifications').default(true),
    studyReminders: boolean('study_reminders').default(true),
    deadlineReminders: boolean('deadline_reminders').default(true),
    dailyGoal: integer('daily_goal').default(60), // minutes
    preferredStudyTime: studyTimeEnum('preferred_study_time').default('evening'),
    studyDays: jsonb('study_days'), // Store as JSON array [0-6 (Sunday-Saturday)]
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex('user_settings_user_id_idx').on(table.userId),
  })
);

// Course tags table
export const courseTags = pgTable(
  'course_tags',
  {
    courseId: text('course_id').notNull(),
    tag: text('tag').notNull(),
  },
  (table) => ({
    courseIdTagIdx: uniqueIndex('course_tags_course_id_tag_idx').on(table.courseId, table.tag),
  })
);

// User favorites table
export const userFavorites = pgTable(
  'user_favorites',
  {
    userId: text('user_id').notNull(),
    courseId: text('course_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdCourseIdIdx: uniqueIndex('user_favorites_user_course_idx').on(table.userId, table.courseId),
  })
);

// Study groups table
export const studyGroups = pgTable(
  'study_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    courseId: text('course_id').notNull(),
    creatorId: text('creator_id').notNull(),
    isPrivate: boolean('is_private').default(false),
    memberCount: integer('member_count').default(1),
    members: jsonb('members').$default([]), // Array of member objects with user_id, role, joined_at
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseIdIdx: index('study_groups_course_id_idx').on(table.courseId),
    creatorIdIdx: index('study_groups_creator_id_idx').on(table.creatorId),
    membersGinIdx: index('study_groups_members_gin_idx').using('gin', table.members),
  })
);

// Study group members table
export const studyGroupMembers = pgTable(
  'study_group_members',
  {
    groupId: text('group_id').notNull(),
    userId: text('user_id').notNull(),
    role: groupRoleEnum('role').default('member'),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
  },
  (table) => ({
    groupIdUserIdIdx: uniqueIndex('study_group_members_group_user_idx').on(table.groupId, table.userId),
    userIdIdx: index('study_group_members_user_id_idx').on(table.userId),
  })
);

// Study group messages table
export const studyGroupMessages = pgTable(
  'study_group_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: text('group_id').notNull(),
    userId: text('user_id').notNull(),
    content: text('content').notNull(),
    type: messageTypeEnum('type').default('text'),
    attachments: jsonb('attachments'), // Array of attachment URLs
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    groupIdIdx: index('study_group_messages_group_id_idx').on(table.groupId),
    userIdIdx: index('study_group_messages_user_id_idx').on(table.userId),
  })
);

// Flash cards table
export const flashCards = pgTable(
  'flash_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: text('course_id'),
    chapterId: text('chapter_id'),
    front: text('front').notNull(), // Question/prompt
    back: text('back').notNull(), // Answer/explanation
    category: text('category').notNull(), // Topic category
    difficulty: difficultyEnum('difficulty').default('beginner'),
    tags: text('tags').array().notNull().default([]), // Additional tags
    isPublished: boolean('is_published').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseIdIdx: index('flash_cards_course_id_idx').on(table.courseId),
    chapterIdIdx: index('flash_cards_chapter_id_idx').on(table.chapterId),
    categoryIdx: index('flash_cards_category_idx').on(table.category),
  })
);

// Flash card reviews table
export const flashCardReviews = pgTable(
  'flash_card_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    flashCardId: text('flash_card_id').notNull(),
    quality: reviewQualityEnum('quality').notNull(), // spaced repetition quality
    easeFactor: real('ease_factor').default(2.5),
    interval: integer('interval').default(1), // days until next review
    repetitions: integer('repetitions').default(0),
    reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
    nextReview: timestamp('next_review').notNull(),
  },
  (table) => ({
    userIdFlashCardIdIdx: uniqueIndex('flash_card_reviews_user_flash_card_idx').on(table.userId, table.flashCardId),
    userIdIdx: index('flash_card_reviews_user_id_idx').on(table.userId),
    nextReviewIdx: index('flash_card_reviews_next_review_idx').on(table.nextReview),
  })
);

// Evaluation stats table
export const evaluationStats = pgTable(
  'evaluation_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    courseId: text('course_id'),
    chapterId: text('chapter_id'),
    totalQuestions: integer('total_questions').default(0),
    correctAnswers: integer('correct_answers').default(0),
    totalTimeSpent: integer('total_time_spent').default(0), // in minutes
    averageScore: real('average_score').default(0),
    bestScore: real('best_score').default(0),
    lastStudiedAt: timestamp('last_studied_at').defaultNow().notNull(),
    streakDays: integer('streak_days').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('evaluation_stats_user_id_idx').on(table.userId),
    courseIdIdx: index('evaluation_stats_course_id_idx').on(table.courseId),
    userCourseChapterIdx: uniqueIndex('evaluation_stats_user_course_chapter_idx').on(table.userId, table.courseId, table.chapterId),
  })
);

// New Consolidated Tables for Database Optimization

// User Items table - consolidates notes, tasks, bookmarks
export const userItems = pgTable(
  'user_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    itemType: itemTypeEnum('item_type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    metadata: jsonb('metadata'),
    status: itemStatusEnum('status').default('active'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_items_user_id_idx').on(table.userId),
    lessonIdIdx: index('user_items_lesson_id_idx').on(table.lessonId),
    itemTypeIdx: index('user_items_item_type_idx').on(table.itemType),
    userLessonTypeIdx: index('user_items_user_lesson_type_idx').on(table.userId, table.lessonId, table.itemType),
    metadataGinIdx: index('user_items_metadata_gin_idx').using('gin', table.metadata),
  })
);

// Item Tags table - unified tagging for user items
export const itemTags = pgTable(
  'item_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    itemId: text('item_id').notNull(),
    tag: text('tag').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    itemIdIdx: index('item_tags_item_id_idx').on(table.itemId),
    tagIdx: index('item_tags_tag_idx').on(table.tag),
    itemTagIdx: uniqueIndex('item_tags_item_tag_idx').on(table.itemId, table.tag),
  })
);

// Activity Log table - consolidates study_sessions and study_activities
export const activityLog = pgTable(
  'activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    lessonId: text('lesson_id'),
    courseId: text('course_id'),
    activityType: activityTypeEnumNew('activity_type').notNull(),
    duration: integer('duration'), // in minutes
    data: jsonb('data'),
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('activity_log_user_id_idx').on(table.userId),
    lessonIdIdx: index('activity_log_lesson_id_idx').on(table.lessonId),
    courseIdIdx: index('activity_log_course_id_idx').on(table.courseId),
    activityTypeIdx: index('activity_log_activity_type_idx').on(table.activityType),
    userDateIdx: index('activity_log_user_date_idx').on(table.userId, table.startedAt.desc()),
    dataGinIdx: index('activity_log_data_gin_idx').using('gin', table.data),
  })
);

// Quiz Submissions table - consolidates quiz_attempts and quiz_answers
export const quizSubmissions = pgTable(
  'quiz_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    quizId: text('quiz_id').notNull(),
    score: real('score').notNull(),
    passed: boolean('passed').notNull(),
    answers: jsonb('answers').notNull(), // Array of question answers with metadata
    startedAt: timestamp('started_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    attemptNumber: integer('attempt_number').notNull(),
    timeSpent: integer('time_spent'), // in seconds
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('quiz_submissions_user_id_idx').on(table.userId),
    quizIdIdx: index('quiz_submissions_quiz_id_idx').on(table.quizId),
    userQuizIdx: index('quiz_submissions_user_quiz_idx').on(table.userId, table.quizId),
    userQuizAttemptIdx: uniqueIndex('quiz_submissions_user_quiz_attempt_idx').on(table.userId, table.quizId, table.attemptNumber),
  })
);

// Export all tables and enums
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;

export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;

export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;

export type QuizAnswer = typeof quizAnswers.$inferSelect;
export type NewQuizAnswer = typeof quizAnswers.$inferInsert;

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type StudySession = typeof studySessions.$inferSelect;
export type NewStudySession = typeof studySessions.$inferInsert;

export type StudyActivity = typeof studyActivities.$inferSelect;
export type NewStudyActivity = typeof studyActivities.$inferInsert;

export type Bookmark = typeof bookmarks.$inferSelect;
export type NewBookmark = typeof bookmarks.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type CourseTag = typeof courseTags.$inferSelect;
export type NewCourseTag = typeof courseTags.$inferInsert;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;

export type StudyGroup = typeof studyGroups.$inferSelect;
export type NewStudyGroup = typeof studyGroups.$inferInsert;

export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;
export type NewStudyGroupMember = typeof studyGroupMembers.$inferInsert;

export type StudyGroupMessage = typeof studyGroupMessages.$inferSelect;
export type NewStudyGroupMessage = typeof studyGroupMessages.$inferInsert;

export type FlashCard = typeof flashCards.$inferSelect;
export type NewFlashCard = typeof flashCards.$inferInsert;

export type FlashCardReview = typeof flashCardReviews.$inferSelect;
export type NewFlashCardReview = typeof flashCardReviews.$inferInsert;

export type EvaluationStats = typeof evaluationStats.$inferSelect;
export type NewEvaluationStats = typeof evaluationStats.$inferInsert;

// New consolidated table types
export type UserItem = typeof userItems.$inferSelect;
export type NewUserItem = typeof userItems.$inferInsert;

export type ItemTag = typeof itemTags.$inferSelect;
export type NewItemTag = typeof itemTags.$inferInsert;

export type ActivityLog = typeof activityLog.$inferSelect;
export type NewActivityLog = typeof activityLog.$inferInsert;

export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type NewQuizSubmission = typeof quizSubmissions.$inferInsert;