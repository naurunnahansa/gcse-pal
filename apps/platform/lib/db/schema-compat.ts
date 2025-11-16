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

// Enums matching the actual database
export const userRoleEnum = pgEnum('user_role', ['student', 'admin', 'teacher']);
export const subjectEnum = pgEnum('subject', ['mathematics', 'english', 'science', 'history', 'geography', 'other']);
export const levelEnum = pgEnum('level', ['gcse', 'igcse', 'a_level']);
export const difficultyEnum = pgEnum('difficulty', ['beginner', 'intermediate', 'advanced']);
export const courseStatusEnum = pgEnum('course_status', ['draft', 'published', 'archived']);
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['active', 'completed', 'paused', 'dropped']);
export const progressStatusEnum = pgEnum('progress_status', ['not_started', 'in_progress', 'completed']);
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer', 'essay']);

// Courses table matching actual database schema
export const coursesCompat = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    created_by: uuid('created_by'),  // Using created_by instead of instructor_id
    title: text('title').notNull(),
    description: text('description').notNull(),
    slug: text('slug'),  // Added slug column that exists in database
    subject: subjectEnum('subject').notNull(),
    level: levelEnum('level').notNull(),
    thumbnail: text('thumbnail'),  // Using thumbnail column
    thumbnail_url: text('thumbnail_url'),  // Using thumbnail_url column
    status: courseStatusEnum('status').default('draft'),
    published_at: timestamp('published_at'),  // Using published_at instead of custom timestamp
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('courses_title_idx').on(table.title),
    subjectIdx: index('courses_subject_idx').on(table.subject),
    statusIdx: index('courses_status_idx').on(table.status),
    createdByIdx: index('courses_created_by_idx').on(table.created_by),
  })
);

// Chapters table matching actual database
export const chaptersCompat = pgTable(
  'chapters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    course_id: text('course_id').notNull(),  // Changed from courseId:uuid to course_id:text
    title: text('title').notNull(),
    description: text('description').notNull(),
    order: integer('order').notNull(),
    duration: integer('duration').notNull(),
    is_published: boolean('is_published').default(false),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    course_idIdx: index('chapters_course_id_idx').on(table.course_id),
    courseOrderIdx: uniqueIndex('chapters_course_order_idx').on(table.course_id, table.order),
  })
);

// Users table
export const usersCompat = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerk_id: text('clerk_id').notNull().unique(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    avatar: text('avatar'),
    role: userRoleEnum('role').default('student'),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    clerk_idIdx: index('users_clerk_id_idx').on(table.clerk_id),
    emailIdx: index('users_email_idx').on(table.email),
  })
);

// Types
export type CourseCompat = typeof coursesCompat.$inferSelect;
export type NewCourseCompat = typeof coursesCompat.$inferInsert;

export type ChapterCompat = typeof chaptersCompat.$inferSelect;
export type NewChapterCompat = typeof chaptersCompat.$inferInsert;

export type UserCompat = typeof usersCompat.$inferSelect;
export type NewUserCompat = typeof usersCompat.$inferInsert;