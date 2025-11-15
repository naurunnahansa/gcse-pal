# Streamlined Database Structure for GCSE Pal
## Reduced from 27 tables to 16 tables (40% reduction)

## Consolidation Strategy:

### 1. **Content Tables Merged**
- `lessons` + `lesson_content` + `lesson_video` → single `lessons` table
- Content stored as JSONB fields

### 2. **Study Tracking Unified**
- `study_sessions` + `study_activities` → single `activity_log` table
- Use activity type to distinguish session types

### 3. **User Content Consolidated**
- `notes` + `tasks` + `bookmarks` → single `user_items` table
- Use item_type field to distinguish

### 4. **Assessment System Streamlined**
- `quiz_attempts` + `quiz_answers` → single `quiz_submissions` table
- Answers stored as JSON array

### 5. **Social Features Simplified**
- `study_group_members` merged into `study_groups` as JSON array
- Reduced message table complexity

```mermaid
erDiagram
    %% Core User Management (2 tables)
    users {
        uuid id PK
        text clerk_id UK
        text email UK
        text name
        text avatar
        enum role
        jsonb preferences
        timestamp created_at
        timestamp updated_at
    }

    enrollments {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        real progress
        enum status
        timestamp enrolled_at
        timestamp completed_at
    }

    %% Course Structure (3 tables)
    courses {
        uuid id PK
        text title
        text description
        enum subject
        enum level
        text thumbnail
        text instructor
        integer duration
        enum difficulty
        enum status
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    chapters {
        uuid id PK
        uuid course_id FK
        text title
        text description
        integer order
        integer duration
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }

    lessons {
        uuid id PK
        uuid chapter_id FK
        text title
        text description
        integer order
        boolean is_published
        jsonb content
        jsonb video_data
        integer duration
        timestamp created_at
        timestamp updated_at
    }

    %% Assessment System (4 tables)
    quizzes {
        uuid id PK
        uuid lesson_id FK
        text title
        text description
        integer time_limit
        real passing_score
        integer max_attempts
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }

    questions {
        uuid id PK
        uuid quiz_id FK
        text question
        enum type
        jsonb options
        text correct_answer
        text explanation
        integer points
        integer order
    }

    quiz_submissions {
        uuid id PK
        uuid user_id FK
        uuid quiz_id FK
        real score
        boolean passed
        jsonb answers
        timestamp started_at
        timestamp completed_at
        integer attempt_number
    }

    %% User Content (3 tables)
    user_items {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        enum item_type
        text title
        text content
        jsonb metadata
        enum status
        timestamp created_at
        timestamp updated_at
    }

    item_tags {
        uuid item_id FK
        text tag
    }

    activity_log {
        uuid id PK
        uuid user_id FK
        uuid lesson_id FK
        enum activity_type
        integer duration
        jsonb data
        timestamp started_at
        timestamp ended_at
    }

    %% Social Features (2 tables)
    study_groups {
        uuid id PK
        uuid course_id FK
        uuid creator_id FK
        text name
        text description
        boolean is_private
        jsonb members
        timestamp created_at
        timestamp updated_at
    }

    group_messages {
        uuid id PK
        uuid group_id FK
        uuid user_id FK
        text content
        jsonb attachments
        timestamp created_at
    }

    %% Learning Tools (2 tables)
    flash_cards {
        uuid id PK
        uuid lesson_id FK
        text front
        text back
        text category
        enum difficulty
        jsonb tags
        boolean is_published
        timestamp created_at
        timestamp updated_at
    }

    flash_card_reviews {
        uuid id PK
        uuid user_id FK
        uuid flash_card_id FK
        enum quality
        real ease_factor
        integer interval
        timestamp reviewed_at
        timestamp next_review
    }

    %% Relationships
    users ||--o{ enrollments : enrolls
    users ||--o{ quiz_submissions : submits
    users ||--o{ user_items : creates
    users ||--o{ activity_log : logs
    users ||--o{ group_messages : sends
    users ||--o{ flash_card_reviews : reviews

    courses ||--o{ chapters : contains
    courses ||--o{ enrollments : enrolled_in
    courses ||--o{ study_groups : about

    chapters ||--o{ lessons : contains

    lessons ||--o{ quizzes : contains
    lessons ||--o{ user_items : references
    lessons ||--o{ activity_log : tracks
    lessons ||--o{ flash_cards : contains

    quizzes ||--o{ questions : contains
    quizzes ||--o{ quiz_submissions : receives

    user_items ||--o{ item_tags : tagged_with

    study_groups ||--o{ group_messages : contains
```

## Key Consolidations:

### 1. **User Settings → Users.preferences**
```sql
-- Instead of separate user_settings table
ALTER TABLE users ADD COLUMN preferences JSONB;
-- Stores: theme, notifications, study_goals, etc.
```

### 2. **Study Tracking → Activity Log**
```sql
-- Single table for all study activities
activity_log {
  activity_type: enum('session', 'video_watch', 'reading', 'quiz_attempt', 'note_taking')
  data: JSONB with activity-specific details
}
```

### 3. **User Content → User Items**
```sql
-- Single table for notes, tasks, bookmarks
user_items {
  item_type: enum('note', 'task', 'bookmark')
  metadata: JSONB with type-specific fields (due_date, priority, timestamp, etc.)
}
```

### 4. **Content Storage → Lessons**
```sql
-- All lesson content in one place
lessons {
  content: JSONB (markdown content, resources)
  video_data: JSONB (video URLs, mux data, duration)
}
```

### 5. **Study Groups → JSON Members**
```sql
-- Members stored as JSON array
study_groups {
  members: JSONB [
    {user_id: "uuid", role: "owner", joined_at: "timestamp"},
    {user_id: "uuid", role: "member", joined_at: "timestamp"}
  ]
}
```

## Benefits of Consolidation:

### 1. **Reduced Complexity**
- 40% fewer tables (27 → 16)
- Simpler schema to understand and maintain
- Fewer joins required for common queries

### 2. **Better Performance**
- Less join overhead
- JSONB fields allow flexible data storage
- Simplified query patterns

### 3. **Easier Development**
- Fewer models to manage
- Simplified API endpoints
- Reduced boilerplate code

### 4. **Maintained Flexibility**
- JSONB fields allow schema evolution
- Enum fields provide structure
- Still maintain data integrity where needed

## Example JSONB Structures:

### User Items (Notes/Tasks/Bookmarks)
```json
// Note
{
  "content": "Lesson notes here...",
  "tags": ["important", "review"],
  "is_private": true
}

// Task
{
  "description": "Complete homework",
  "due_date": "2024-12-01",
  "priority": "high",
  "tags": ["homework"]
}

// Bookmark
{
  "timestamp": 1250,
  "note": "Important concept here"
}
```

### Activity Log
```json
// Video Watch
{
  "video_url": "https://...",
  "watched_seconds": 300,
  "total_seconds": 600
}

// Study Session
{
  "pages_read": 5,
  "notes_taken": true,
  "focus_score": 8.5
}

// Quiz Attempt
{
  "quiz_id": "uuid",
  "score": 85,
  "questions_answered": 10
}
```

This streamlined approach maintains all functionality while being much more manageable and performant.