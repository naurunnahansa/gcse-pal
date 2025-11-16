-- Simplified Database Schema for GCSE Pal
-- Focus: Courses and Quizzes
-- Tables: 13 (down from 25+)

-- Drop existing tables if we're starting fresh
-- NOTE: Uncomment these lines for a fresh start, otherwise migrate incrementally
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Enums for the simplified schema
CREATE TYPE user_role AS ENUM ('student', 'admin', 'teacher');
CREATE TYPE subject AS ENUM ('mathematics', 'english', 'science', 'history', 'geography', 'other');
CREATE TYPE level AS ENUM ('gcse', 'igcse', 'a_level');
CREATE TYPE difficulty AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'paused', 'dropped');
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'short_answer', 'essay');

-- ========================================
-- CORE TABLES (13 tables total)
-- ========================================

-- 1. Users table - Clean user management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Courses table - Course catalog
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    subject subject NOT NULL,
    level level DEFAULT 'gcse',
    thumbnail TEXT,
    instructor TEXT NOT NULL,
    instructor_id TEXT,
    duration INTEGER NOT NULL, -- in minutes
    difficulty difficulty DEFAULT 'beginner',
    topics TEXT[] NOT NULL DEFAULT '{}',
    status course_status DEFAULT 'draft',
    enrollment_count INTEGER DEFAULT 0,
    rating REAL DEFAULT 0,
    price REAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Chapters table - Course organization
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 4. Lessons table - Lesson content (video/text/both)
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT, -- Markdown content
    video_url TEXT,
    video_duration INTEGER, -- in milliseconds
    has_video BOOLEAN DEFAULT false,
    has_markdown BOOLEAN DEFAULT false,
    "order" INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    is_published BOOLEAN DEFAULT false,
    mux_asset_id TEXT,
    mux_upload_id TEXT,
    mux_status TEXT DEFAULT 'none',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. Quizzes table - Assessments
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    time_limit INTEGER, -- in minutes
    passing_score REAL DEFAULT 70, -- percentage
    max_attempts INTEGER DEFAULT 3,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 6. Questions table - Quiz questions
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    type question_type NOT NULL,
    "order" INTEGER NOT NULL,
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Answers table - Question options (PROPERLY NORMALIZED!)
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Enrollments table - User enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    progress REAL DEFAULT 0, -- 0-100 percentage
    status enrollment_status DEFAULT 'active'
);

-- 9. Course Progress table - High-level progress
CREATE TABLE course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    time_spent INTEGER DEFAULT 0, -- in minutes
    UNIQUE(user_id, course_id)
);

-- 10. Lesson Progress table - Detailed tracking
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status progress_status DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, lesson_id)
);

-- 11. Quiz Attempts table - Quiz tracking
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    passed BOOLEAN NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent INTEGER DEFAULT 0, -- in minutes
    attempt_number INTEGER NOT NULL
);

-- 12. User Answers table - Individual answers
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_id UUID REFERENCES answers(id) ON DELETE CASCADE, -- For MCQ
    text_answer TEXT, -- For short answer/essay
    is_correct BOOLEAN NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ========================================
-- INDEXES for performance
-- ========================================

-- Users indexes
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Courses indexes
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);

-- Chapters indexes
CREATE INDEX idx_chapters_course_id ON chapters(course_id);
CREATE UNIQUE INDEX idx_chapters_course_order ON chapters(course_id, "order");

-- Lessons indexes
CREATE INDEX idx_lessons_chapter_id ON lessons(chapter_id);
CREATE UNIQUE INDEX idx_lessons_chapter_order ON lessons(chapter_id, "order");

-- Quizzes indexes
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);

-- Questions indexes
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);

-- Answers indexes
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- Enrollments indexes
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE UNIQUE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Progress indexes
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- Quiz attempts indexes
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- User answers indexes
CREATE INDEX idx_user_answers_attempt_id ON user_answers(attempt_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);

-- ========================================
-- TRIGGERS for updated_at
-- ========================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CONSTRAINTS for data integrity
-- ========================================

-- Ensure passing_score is between 0 and 100
ALTER TABLE quizzes ADD CONSTRAINT check_passing_score CHECK (passing_score >= 0 AND passing_score <= 100);

-- Ensure progress is between 0 and 100
ALTER TABLE enrollments ADD CONSTRAINT check_enrollment_progress CHECK (progress >= 0 AND progress <= 100);

-- Ensure time fields are positive
ALTER TABLE lessons ADD CONSTRAINT check_lesson_duration CHECK (duration >= 0);
ALTER TABLE chapters ADD CONSTRAINT check_chapter_duration CHECK (duration >= 0);
ALTER TABLE courses ADD CONSTRAINT check_course_duration CHECK (duration >= 0);

-- Ensure quiz attempt number is positive
ALTER TABLE quiz_attempts ADD CONSTRAINT check_attempt_number CHECK (attempt_number > 0);

-- ========================================
-- VIEWS for common queries
-- ========================================

-- Course progress view with user info
CREATE VIEW course_enrollment_details AS
SELECT
    c.id as course_id,
    c.title as course_title,
    c.subject,
    c.level,
    u.id as user_id,
    u.name as user_name,
    u.email,
    e.enrolled_at,
    e.status as enrollment_status,
    e.progress,
    cp.status as progress_status,
    cp.completed_at as course_completed_at
FROM courses c
JOIN enrollments e ON c.id = e.course_id
JOIN users u ON e.user_id = u.id
LEFT JOIN course_progress cp ON u.id = cp.user_id AND c.id = cp.course_id;

-- Quiz performance view
CREATE VIEW quiz_performance AS
SELECT
    q.id as quiz_id,
    q.title as quiz_title,
    u.id as user_id,
    u.name as user_name,
    qa.attempt_number,
    qa.score,
    qa.passed,
    qa.completed_at,
    ROW_NUMBER() OVER (PARTITION BY q.id, u.id ORDER BY qa.attempt_number DESC) as latest_attempt
FROM quizzes q
JOIN quiz_attempts qa ON q.id = qa.quiz_id
JOIN users u ON qa.user_id = u.id;

-- ========================================
-- SAMPLE DATA (optional - for testing)
-- ========================================

-- NOTE: Uncomment these inserts to create sample data for testing

-- Sample courses
-- INSERT INTO courses (title, description, subject, level, instructor, duration, topics) VALUES
-- ('GCSE Mathematics Foundation', 'Complete GCSE Math foundation course', 'mathematics', 'gcse', 'Dr. Smith', 1200, ARRAY['Algebra', 'Geometry', 'Statistics']),
-- ('GCSE English Language', 'English Language preparation for GCSE', 'english', 'gcse', 'Mrs. Johnson', 900, ARRAY['Reading', 'Writing', 'Grammar']);

-- ========================================
-- MIGRATION NOTES
-- ========================================

/*
Migration from old schema:

1. USERS: Mostly compatible, just remove JSONB preferences
2. COURSES: Remove rating/enrollment_count (can be calculated)
3. CHAPTERS: Direct migration
4. LESSONS: Simplify - remove contentData/videoData JSONB
5. QUIZZES: Direct migration
6. QUESTIONS: Remove options/correctAnswer JSON fields
7. ANSWERS: NEW TABLE - migrate from questions.options
8. ENROLLMENTS: Direct migration
9. COURSE_PROGRESS: Migrate from progress table (course-level only)
10. LESSON_PROGRESS: Migrate from progress table (lesson-level only)
11. QUIZ_ATTEMPTS: Rename from quiz_attempts
12. USER_ANSWERS: Rename from quiz_answers, add answer_id reference

Tables to REMOVE:
- notes, tasks, bookmarks, study_sessions, study_activities
- user_settings, course_tags, user_favorites
- study_groups, study_group_members, study_group_messages
- flash_cards, flash_card_reviews
- evaluation_stats
- user_items, item_tags, activity_log, quiz_submissions

This reduces complexity from 25+ tables to 13 focused tables.
*/