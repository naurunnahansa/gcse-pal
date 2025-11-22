CREATE TABLE "answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"ans" text NOT NULL,
	"approved" boolean,
	"contributor" text NOT NULL,
	"contributor_id" text NOT NULL,
	"question_id" integer NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"order_index" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"course_id" uuid NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"thumbnail_url" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"is_free" boolean DEFAULT false NOT NULL,
	"created_by_clerk_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markdown_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "markdown_content_page_id_unique" UNIQUE("page_id")
);
--> statement-breakpoint
CREATE TABLE "page_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"page_id" uuid NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"order_index" integer NOT NULL,
	"page_type" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"quiz" text NOT NULL,
	"approved" boolean,
	"contributor" text NOT NULL,
	"contributor_id" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_course_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"teacher_clerk_id" varchar(255) NOT NULL,
	"course_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255),
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'free_student' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markdown_content" ADD CONSTRAINT "markdown_content_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_progress" ADD CONSTRAINT "page_progress_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapters_course_idx" ON "chapters" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "chapters_order_idx" ON "chapters" USING btree ("course_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_user_course_idx" ON "course_enrollments" USING btree ("clerk_id","course_id");--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "course_enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "enrollments_user_idx" ON "course_enrollments" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "courses_published_idx" ON "courses" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "courses_creator_idx" ON "courses" USING btree ("created_by_clerk_id");--> statement-breakpoint
CREATE INDEX "markdown_content_page_idx" ON "markdown_content" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_page_idx" ON "page_progress" USING btree ("clerk_id","page_id");--> statement-breakpoint
CREATE INDEX "progress_page_idx" ON "page_progress" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "progress_user_idx" ON "page_progress" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "pages_chapter_idx" ON "pages" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "pages_order_idx" ON "pages" USING btree ("chapter_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "assignments_teacher_course_idx" ON "teacher_course_assignments" USING btree ("teacher_clerk_id","course_id");--> statement-breakpoint
CREATE INDEX "assignments_course_idx" ON "teacher_course_assignments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "assignments_teacher_idx" ON "teacher_course_assignments" USING btree ("teacher_clerk_id");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");