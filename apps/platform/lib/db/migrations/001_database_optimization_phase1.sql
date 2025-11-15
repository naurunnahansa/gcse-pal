-- Migration Script: Database Optimization Phase 1
-- Consolidates multiple tables into unified structures for better performance and maintainability

-- Phase 1: Create new consolidated tables

-- Create item_type enum
DO $$ BEGIN
    CREATE TYPE item_type_enum AS ENUM ('note', 'task', 'bookmark');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create item_status enum
DO $$ BEGIN
    CREATE TYPE item_status_enum AS ENUM ('active', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create activity_type_new enum
DO $$ BEGIN
    CREATE TYPE activity_type_new_enum AS ENUM ('study_session', 'video_watch', 'quiz_attempt', 'lesson_view');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create user_items table (consolidates notes, tasks, bookmarks)
CREATE TABLE IF NOT EXISTS user_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    item_type item_type_enum NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    metadata JSONB,
    status item_status_enum DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create item_tags table (unified tagging for user items)
CREATE TABLE IF NOT EXISTS item_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(item_id, tag)
);

-- Create activity_log table (consolidates study_sessions and study_activities)
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    lesson_id TEXT,
    course_id TEXT,
    activity_type activity_type_new_enum NOT NULL,
    duration INTEGER, -- in minutes
    data JSONB,
    started_at TIMESTAMP DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create quiz_submissions table (consolidates quiz_attempts and quiz_answers)
CREATE TABLE IF NOT EXISTS quiz_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    quiz_id TEXT NOT NULL,
    score REAL NOT NULL,
    passed BOOLEAN NOT NULL,
    answers JSONB NOT NULL, -- Array of question answers with metadata
    started_at TIMESTAMP DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP,
    attempt_number INTEGER NOT NULL,
    time_spent INTEGER, -- in seconds
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, quiz_id, attempt_number)
);

-- Phase 2: Create strategic indexes for performance

-- Indexes for user_items
CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);
CREATE INDEX IF NOT EXISTS idx_user_items_lesson_id ON user_items(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_items_item_type ON user_items(item_type);
CREATE INDEX IF NOT EXISTS idx_user_items_user_lesson_type ON user_items(user_id, lesson_id, item_type);
CREATE INDEX IF NOT EXISTS idx_user_items_metadata_gin ON user_items USING gin(metadata);

-- Indexes for item_tags
CREATE INDEX IF NOT EXISTS idx_item_tags_item_id ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags(tag);

-- Indexes for activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_lesson_id ON activity_log(lesson_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_course_id ON activity_log(course_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_activity_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_date ON activity_log(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_data_gin ON activity_log USING gin(data);

-- Indexes for quiz_submissions
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_id ON quiz_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz_id ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_user_quiz ON quiz_submissions(user_id, quiz_id);

-- Phase 3: Data migration

-- Migrate notes to user_items
INSERT INTO user_items (id, user_id, lesson_id, item_type, title, content, metadata, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    lesson_id,
    'note'::item_type_enum,
    title,
    content,
    jsonb_build_object('tags', COALESCE(tags, '[]'), 'is_private', COALESCE(is_private, false)),
    created_at,
    updated_at
FROM notes
ON CONFLICT DO NOTHING;

-- Migrate note tags to item_tags
INSERT INTO item_tags (item_id, tag, created_at)
SELECT
    ui.id,
    tag,
    NOW()
FROM user_items ui
JOIN notes n ON ui.user_id = n.user_id AND ui.lesson_id = n.lesson_id AND ui.item_type = 'note'
CROSS JOIN unnest(COALESCE(n.tags, '{}')) AS tag
ON CONFLICT (item_id, tag) DO NOTHING;

-- Migrate tasks to user_items
INSERT INTO user_items (id, user_id, lesson_id, item_type, title, content, metadata, status, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    lesson_id,
    'task'::item_type_enum,
    title,
    description,
    jsonb_build_object(
        'tags', COALESCE(tags, '[]'),
        'due_date', due_date,
        'priority', COALESCE(priority, 'medium')
    ),
    CASE
        WHEN status = 'completed' THEN 'completed'::item_status_enum
        WHEN status = 'cancelled' THEN 'archived'::item_status_enum
        ELSE 'active'::item_status_enum
    END,
    created_at,
    updated_at
FROM tasks
ON CONFLICT DO NOTHING;

-- Migrate task tags to item_tags
INSERT INTO item_tags (item_id, tag, created_at)
SELECT
    ui.id,
    tag,
    NOW()
FROM user_items ui
JOIN tasks t ON ui.user_id = t.user_id AND ui.lesson_id = t.lesson_id AND ui.item_type = 'task'
CROSS JOIN unnest(COALESCE(t.tags, '{}')) AS tag
ON CONFLICT (item_id, tag) DO NOTHING;

-- Migrate bookmarks to user_items
INSERT INTO user_items (id, user_id, lesson_id, item_type, title, metadata, created_at, updated_at)
SELECT
    gen_random_uuid(),
    user_id,
    lesson_id,
    'bookmark'::item_type_enum,
    'Bookmark',
    jsonb_build_object('timestamp', COALESCE(timestamp, 0), 'note', COALESCE(note, '')),
    created_at,
    created_at as updated_at
FROM bookmarks
ON CONFLICT DO NOTHING;

-- Migrate study_sessions to activity_log
INSERT INTO activity_log (id, user_id, lesson_id, course_id, activity_type, duration, data, started_at, ended_at, created_at)
SELECT
    gen_random_uuid(),
    user_id,
    lesson_id,
    course_id,
    'study_session'::activity_type_new_enum,
    duration,
    jsonb_build_object('notes', COALESCE(notes, '')),
    start_time,
    end_time,
    created_at
FROM study_sessions
ON CONFLICT DO NOTHING;

-- Migrate study_activities to activity_log
INSERT INTO activity_log (id, user_id, lesson_id, activity_type, duration, data, started_at, ended_at, created_at)
SELECT
    gen_random_uuid(),
    user_id,
    lesson_id,
    CASE activity_type
        WHEN 'watch_video' THEN 'video_watch'::activity_type_new_enum
        WHEN 'read_markdown' THEN 'lesson_view'::activity_type_new_enum
        WHEN 'take_quiz' THEN 'quiz_attempt'::activity_type_new_enum
        ELSE activity_type::activity_type_new_enum
    END,
    duration_minutes,
    jsonb_build_object(
        'activity_type', activity_type,
        'score', score,
        'pages_read', pages_read,
        'video_url', video_url
    ),
    timestamp as started_at,
    CASE
        WHEN duration_minutes IS NOT NULL THEN timestamp + (duration_minutes || ' minutes')::INTERVAL
        ELSE NULL
    END as ended_at,
    created_at
FROM study_activities
ON CONFLICT DO NOTHING;

-- Migrate quiz_attempts and quiz_answers to quiz_submissions
INSERT INTO quiz_submissions (id, user_id, quiz_id, score, passed, answers, started_at, completed_at, attempt_number, time_spent, created_at)
SELECT
    gen_random_uuid(),
    qa.user_id,
    qa.quiz_id,
    qa.score,
    qa.passed,
    jsonb_agg(
        jsonb_build_object(
            'question_id', qans.question_id,
            'answer', qans.answer,
            'is_correct', qans.is_correct,
            'points', qans.points,
            'feedback', qans.feedback
        )
    ) as answers,
    qa.started_at,
    qa.completed_at,
    (SELECT COUNT(*) FROM quiz_attempts WHERE user_id = qa.user_id AND quiz_id = qa.quiz_id AND started_at <= qa.started_at)::integer,
    qa.time_spent,
    qa.created_at
FROM quiz_attempts qa
JOIN quiz_answers qans ON qa.id = qans.attempt_id
GROUP BY qa.id, qa.user_id, qa.quiz_id, qa.score, qa.passed, qa.started_at, qa.completed_at, qa.time_spent, qa.created_at
ON CONFLICT (user_id, quiz_id, attempt_number) DO NOTHING;

-- Phase 4: Add JSONB columns to lessons table for enhanced content management
DO $$
BEGIN
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content_data JSONB;
    ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_data JSONB;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Create GIN indexes for new JSONB columns
CREATE INDEX IF NOT EXISTS idx_lessons_content_data_gin ON lessons USING gin(content_data);
CREATE INDEX IF NOT EXISTS idx_lessons_video_data_gin ON lessons USING gin(video_data);

-- Phase 5: Archive old tables (backup before dropping)
-- Commented out for safety - will be executed in Phase 4 after validation
-- ALTER TABLE notes RENAME TO notes_archive_$(date +%Y%m%d);
-- ALTER TABLE tasks RENAME TO tasks_archive_$(date +%Y%m%d);
-- ALTER TABLE bookmarks RENAME TO bookmarks_archive_$(date +%Y%m%d);
-- ALTER TABLE study_sessions RENAME TO study_sessions_archive_$(date +%Y%m%d);
-- ALTER TABLE study_activities RENAME TO study_activities_archive_$(date +%Y%m%d);
-- ALTER TABLE quiz_attempts RENAME TO quiz_attempts_archive_$(date +%Y%m%d);
-- ALTER TABLE quiz_answers RENAME TO quiz_answers_archive_$(date +%Y%m%d);

COMMIT;