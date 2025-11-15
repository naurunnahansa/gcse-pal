CREATE TYPE "public"."activity_type" AS ENUM('watch_video', 'read_markdown', 'take_quiz', 'take_notes', 'practice_exercise');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('beginner', 'intermediate', 'advanced');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'completed', 'paused', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."group_role" AS ENUM('owner', 'moderator', 'member');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('gcse', 'igcse', 'a_level');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'file', 'link');--> statement-breakpoint
CREATE TYPE "public"."progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('multiple_choice', 'true_false', 'short_answer', 'essay');--> statement-breakpoint
CREATE TYPE "public"."review_quality" AS ENUM('again', 'hard', 'good', 'easy');--> statement-breakpoint
CREATE TYPE "public"."study_time" AS ENUM('morning', 'afternoon', 'evening');--> statement-breakpoint
CREATE TYPE "public"."subject" AS ENUM('mathematics', 'english', 'science', 'history', 'geography', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('student', 'admin', 'teacher');--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"chapter_id" text,
	"lesson_id" text,
	"timestamp" integer,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"order" integer NOT NULL,
	"duration" integer NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_tags" (
	"course_id" text NOT NULL,
	"tag" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"subject" "subject" NOT NULL,
	"level" "level" DEFAULT 'gcse',
	"thumbnail" text,
	"instructor" text NOT NULL,
	"instructor_id" text,
	"duration" integer NOT NULL,
	"difficulty" "difficulty" DEFAULT 'beginner',
	"topics" text[] DEFAULT '{}' NOT NULL,
	"status" "course_status" DEFAULT 'draft',
	"enrollment_count" integer DEFAULT 0,
	"rating" real DEFAULT 0,
	"price" real DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"progress" real DEFAULT 0,
	"status" "enrollment_status" DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE "evaluation_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"chapter_id" text,
	"total_questions" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"total_time_spent" integer DEFAULT 0,
	"average_score" real DEFAULT 0,
	"best_score" real DEFAULT 0,
	"last_studied_at" timestamp DEFAULT now() NOT NULL,
	"streak_days" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_card_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"flash_card_id" text NOT NULL,
	"quality" "review_quality" NOT NULL,
	"ease_factor" real DEFAULT 2.5,
	"interval" integer DEFAULT 1,
	"repetitions" integer DEFAULT 0,
	"reviewed_at" timestamp DEFAULT now() NOT NULL,
	"next_review" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flash_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text,
	"chapter_id" text,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" "difficulty" DEFAULT 'beginner',
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text,
	"video_url" text,
	"video_duration" integer,
	"markdown_path" text,
	"has_video" boolean DEFAULT false,
	"has_markdown" boolean DEFAULT false,
	"order" integer NOT NULL,
	"duration" integer NOT NULL,
	"is_published" boolean DEFAULT false,
	"mux_asset_id" text,
	"mux_upload_id" text,
	"mux_status" text DEFAULT 'none',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"chapter_id" text,
	"lesson_id" text,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"is_private" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"chapter_id" text,
	"lesson_id" text,
	"status" "progress_status" DEFAULT 'not_started',
	"started_at" timestamp,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0,
	"score" real,
	"last_accessed" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" text NOT NULL,
	"question" text NOT NULL,
	"type" "question_type" NOT NULL,
	"options" text,
	"correct_answer" text NOT NULL,
	"explanation" text,
	"points" integer DEFAULT 1,
	"order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"user_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"points" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"quiz_id" text NOT NULL,
	"score" real NOT NULL,
	"passed" boolean NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent" integer DEFAULT 0,
	"attempt_number" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quizzes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" text,
	"chapter_id" text,
	"course_id" text,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"time_limit" integer,
	"passing_score" real DEFAULT 70,
	"max_attempts" integer DEFAULT 3,
	"is_published" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" text NOT NULL,
	"type" "activity_type" NOT NULL,
	"resource_id" text NOT NULL,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"data" jsonb
);
--> statement-breakpoint
CREATE TABLE "study_group_members" (
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "group_role" DEFAULT 'member',
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_group_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"type" "message_type" DEFAULT 'text',
	"attachments" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"course_id" text NOT NULL,
	"creator_id" text NOT NULL,
	"is_private" boolean DEFAULT false,
	"member_count" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text,
	"lesson_id" text,
	"start_time" timestamp DEFAULT now() NOT NULL,
	"end_time" timestamp,
	"duration" integer,
	"pages_read" integer,
	"videos_watched" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"course_id" text,
	"chapter_id" text,
	"lesson_id" text,
	"priority" "task_priority" DEFAULT 'medium',
	"status" "task_status" DEFAULT 'pending',
	"due_date" timestamp,
	"completed_at" timestamp,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"theme" "theme" DEFAULT 'light',
	"email_notifications" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT true,
	"study_reminders" boolean DEFAULT true,
	"deadline_reminders" boolean DEFAULT true,
	"daily_goal" integer DEFAULT 60,
	"preferred_study_time" "study_time" DEFAULT 'evening',
	"study_days" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text,
	"role" "user_role" DEFAULT 'student',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "bookmarks_user_id_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_resource_idx" ON "bookmarks" USING btree ("user_id","course_id","chapter_id","lesson_id");--> statement-breakpoint
CREATE INDEX "chapters_course_id_idx" ON "chapters" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chapters_course_order_idx" ON "chapters" USING btree ("course_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "course_tags_course_id_tag_idx" ON "course_tags" USING btree ("course_id","tag");--> statement-breakpoint
CREATE INDEX "courses_title_idx" ON "courses" USING btree ("title");--> statement-breakpoint
CREATE INDEX "courses_subject_idx" ON "courses" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "courses_status_idx" ON "courses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "courses_instructor_id_idx" ON "courses" USING btree ("instructor_id");--> statement-breakpoint
CREATE INDEX "enrollments_user_id_idx" ON "enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_id_idx" ON "enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_user_course_idx" ON "enrollments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "evaluation_stats_user_id_idx" ON "evaluation_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "evaluation_stats_course_id_idx" ON "evaluation_stats" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "evaluation_stats_user_course_chapter_idx" ON "evaluation_stats" USING btree ("user_id","course_id","chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "flash_card_reviews_user_flash_card_idx" ON "flash_card_reviews" USING btree ("user_id","flash_card_id");--> statement-breakpoint
CREATE INDEX "flash_card_reviews_user_id_idx" ON "flash_card_reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "flash_card_reviews_next_review_idx" ON "flash_card_reviews" USING btree ("next_review");--> statement-breakpoint
CREATE INDEX "flash_cards_course_id_idx" ON "flash_cards" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "flash_cards_chapter_id_idx" ON "flash_cards" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "flash_cards_category_idx" ON "flash_cards" USING btree ("category");--> statement-breakpoint
CREATE INDEX "lessons_chapter_id_idx" ON "lessons" USING btree ("chapter_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_chapter_order_idx" ON "lessons" USING btree ("chapter_id","order");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_course_id_idx" ON "notes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "notes_chapter_id_idx" ON "notes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "notes_lesson_id_idx" ON "notes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "progress_user_id_idx" ON "progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "progress_course_id_idx" ON "progress" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_course_unique_idx" ON "progress" USING btree ("user_id","course_id","chapter_id","lesson_id");--> statement-breakpoint
CREATE INDEX "questions_quiz_id_idx" ON "questions" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_attempt_id_idx" ON "quiz_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_question_id_idx" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_user_id_idx" ON "quiz_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_id_idx" ON "quiz_attempts" USING btree ("quiz_id");--> statement-breakpoint
CREATE INDEX "quizzes_lesson_id_idx" ON "quizzes" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "quizzes_chapter_id_idx" ON "quizzes" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "quizzes_course_id_idx" ON "quizzes" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "study_activities_session_id_idx" ON "study_activities" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "study_activities_type_idx" ON "study_activities" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "study_group_members_group_user_idx" ON "study_group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "study_group_members_user_id_idx" ON "study_group_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_group_messages_group_id_idx" ON "study_group_messages" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "study_group_messages_user_id_idx" ON "study_group_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_groups_course_id_idx" ON "study_groups" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "study_groups_creator_id_idx" ON "study_groups" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "study_sessions_user_id_idx" ON "study_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_sessions_course_id_idx" ON "study_sessions" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "study_sessions_lesson_id_idx" ON "study_sessions" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_favorites_user_course_idx" ON "user_favorites" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_settings_user_id_idx" ON "user_settings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");