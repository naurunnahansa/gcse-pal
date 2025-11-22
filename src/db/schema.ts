import { pgTable, serial, text, boolean, timestamp, integer, uuid, varchar, index, uniqueIndex, json } from 'drizzle-orm/pg-core'
import { relations, type InferSelectModel } from 'drizzle-orm'

// ============================================
// EXISTING Q&A TABLES (Preserved for migration)
// ============================================

// Questions table
export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  quiz: text('quiz').notNull(),
  approved: boolean('approved'),
  contributor: text('contributor').notNull(),
  contributorId: text('contributor_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
})

// Answers table
export const answers = pgTable('answers', {
  id: serial('id').primaryKey(),
  ans: text('ans').notNull(),
  approved: boolean('approved'),
  contributor: text('contributor').notNull(),
  contributorId: text('contributor_id').notNull(),
  questionId: integer('question_id')
    .notNull()
    .references(() => questions.id),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow(),
})

// ============================================
// NEW LMS TABLES
// ============================================

// Users table (minimal, mostly stored in Clerk)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('free_student'), // admin, teacher, pro_student, free_student
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    clerkIdIdx: index('users_clerk_id_idx').on(table.clerkId),
    roleIdx: index('users_role_idx').on(table.role),
  }
})

// Courses table
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  isPublished: boolean('is_published').default(false).notNull(),
  isFree: boolean('is_free').default(false).notNull(), // Whether course is available to free students
  createdByClerkId: varchar('created_by_clerk_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    publishedIdx: index('courses_published_idx').on(table.isPublished),
    creatorIdx: index('courses_creator_idx').on(table.createdByClerkId),
  }
})

// Chapters table
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  isFree: boolean('is_free').default(false).notNull(), // Free preview chapter
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    courseIdx: index('chapters_course_idx').on(table.courseId),
    orderIdx: index('chapters_order_idx').on(table.courseId, table.orderIndex),
  }
})

// Pages table
export const pages = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').notNull().references(() => chapters.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  orderIndex: integer('order_index').notNull(),
  pageType: varchar('page_type', { length: 50 }).notNull(), // 'markdown', 'video', 'quiz'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    chapterIdx: index('pages_chapter_idx').on(table.chapterId),
    orderIdx: index('pages_order_idx').on(table.chapterId, table.orderIndex),
  }
})

// Markdown content table
export const markdownContent = pgTable('markdown_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }).unique(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    pageIdx: index('markdown_content_page_idx').on(table.pageId),
  }
})

// Course enrollments table
export const courseEnrollments = pgTable('course_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => {
  return {
    userCourseIdx: uniqueIndex('enrollments_user_course_idx').on(table.clerkId, table.courseId),
    courseIdx: index('enrollments_course_idx').on(table.courseId),
    userIdx: index('enrollments_user_idx').on(table.clerkId),
  }
})

// Page progress table
export const pageProgress = pgTable('page_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull(),
  pageId: uuid('page_id').notNull().references(() => pages.id, { onDelete: 'cascade' }),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => {
  return {
    userPageIdx: uniqueIndex('progress_user_page_idx').on(table.clerkId, table.pageId),
    pageIdx: index('progress_page_idx').on(table.pageId),
    userIdx: index('progress_user_idx').on(table.clerkId),
  }
})

// Teacher course assignments
export const teacherCourseAssignments = pgTable('teacher_course_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherClerkId: varchar('teacher_clerk_id', { length: 255 }).notNull(),
  courseId: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    teacherCourseIdx: uniqueIndex('assignments_teacher_course_idx').on(table.teacherClerkId, table.courseId),
    courseIdx: index('assignments_course_idx').on(table.courseId),
    teacherIdx: index('assignments_teacher_idx').on(table.teacherClerkId),
  }
})

// ============================================
// CHAT TABLES
// ============================================

// Chat sessions
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: varchar('clerk_id', { length: 255 }).notNull(),
  title: text('title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    userIdx: index('chats_user_idx').on(table.clerkId),
    createdIdx: index('chats_created_idx').on(table.createdAt),
  }
})

export type Chat = InferSelectModel<typeof chats>

// Chat messages
export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(), // 'user', 'assistant', 'system', 'tool'
  parts: json('parts').notNull(), // message parts (text, tool calls, etc.)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    chatIdx: index('chat_messages_chat_idx').on(table.chatId),
    createdIdx: index('chat_messages_created_idx').on(table.createdAt),
  }
})

export type ChatMessage = InferSelectModel<typeof chatMessages>

// ============================================
// RELATIONSHIPS
// ============================================

// Existing Q&A relationships
export const questionsRelations = relations(questions, ({ many }) => ({
  answers: many(answers),
}))

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}))

// LMS relationships
export const coursesRelations = relations(courses, ({ many }) => ({
  chapters: many(chapters),
  enrollments: many(courseEnrollments),
  teacherAssignments: many(teacherCourseAssignments),
}))

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  course: one(courses, {
    fields: [chapters.courseId],
    references: [courses.id],
  }),
  pages: many(pages),
}))

export const pagesRelations = relations(pages, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [pages.chapterId],
    references: [chapters.id],
  }),
  markdownContent: one(markdownContent, {
    fields: [pages.id],
    references: [markdownContent.pageId],
  }),
  progress: many(pageProgress),
}))

export const markdownContentRelations = relations(markdownContent, ({ one }) => ({
  page: one(pages, {
    fields: [markdownContent.pageId],
    references: [pages.id],
  }),
}))

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one }) => ({
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
}))

export const pageProgressRelations = relations(pageProgress, ({ one }) => ({
  page: one(pages, {
    fields: [pageProgress.pageId],
    references: [pages.id],
  }),
}))

export const teacherCourseAssignmentsRelations = relations(teacherCourseAssignments, ({ one }) => ({
  course: one(courses, {
    fields: [teacherCourseAssignments.courseId],
    references: [courses.id],
  }),
}))

// Chat relationships
export const chatsRelations = relations(chats, ({ many }) => ({
  messages: many(chatMessages),
}))

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  chat: one(chats, {
    fields: [chatMessages.chatId],
    references: [chats.id],
  }),
}))