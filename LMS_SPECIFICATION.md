# Learning Management System - Technical Specification v2

## Table of Contents
1. [System Overview](#system-overview)
2. [Authentication & External Services](#authentication--external-services)
3. [Database Schema](#database-schema)
4. [User Roles & Permissions](#user-roles--permissions)
5. [API Routes & Protection](#api-routes--protection)
6. [Business Logic](#business-logic)

---

## System Overview

A comprehensive Learning Management System (LMS) with AI-powered features including personalized quiz generation, course-specific chatbots, and adaptive learning based on performance tracking.

### Core Features
- Multi-role user system (Admin, Teacher, Pro Student, Free Student)
- Hierarchical content organization (Courses → Chapters → Pages)
- Multiple page types (Markdown, Video, Quiz)
- AI chatbot with course-specific and global contexts
- Quiz attempt tracking for performance analytics
- AI-generated personalized quizzes

---

## Authentication & External Services

### Clerk Authentication
- **User Management**: All user data (email, name, authentication) managed by Clerk
- **User Identification**: Store only `clerk_id` in database
- **Webhook Integration**: Sync user creation/deletion via Clerk webhooks
- **Session Management**: Use Clerk's session tokens
- **Role Management**: Store roles in app metadata via Clerk API

```typescript
// Clerk user metadata structure
interface ClerkUserMetadata {
  publicMetadata: {
    role: 'admin' | 'teacher' | 'pro_student' | 'free_student';
    subscription_status?: 'active' | 'cancelled' | 'past_due';
    subscription_tier?: 'free' | 'pro';
  };
  privateMetadata: {
    stripe_customer_id?: string;
  };
}
```

### Mux Video Hosting
- **Video Upload**: Upload videos directly to Mux
- **Video Storage**: Mux handles all video storage and processing
- **Video Delivery**: Use Mux playback URLs and player
- **Thumbnail Generation**: Automatic via Mux
- **Video Analytics**: Track via Mux Data

```typescript
// Mux asset structure stored in database
interface MuxVideoData {
  asset_id: string;        // Mux Asset ID
  playback_id: string;     // Mux Playback ID
  status: 'preparing' | 'ready' | 'errored';
  duration?: number;       // In seconds
  aspect_ratio?: string;   // e.g., "16:9"
  max_stored_resolution?: string; // e.g., "1080p"
}
```

---

## Database Schema

### Users Table (Minimal - Clerk Integration)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_clerk_id ON users(clerk_id);

-- Note: Role, email, name, etc. are fetched from Clerk API when needed
-- or cached temporarily in application layer
```

### Courses Table
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  access_level ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  is_published BOOLEAN DEFAULT false,
  created_by_clerk_id VARCHAR(255) NOT NULL, -- Reference to Clerk user
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courses_access_level ON courses(access_level);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_creator ON courses(created_by_clerk_id);
```

### Course Enrollments Table
```sql
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_accessed TIMESTAMP,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  completed_at TIMESTAMP,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON course_enrollments(course_id);
```

### Chapters Table
```sql
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, order_index)
);

CREATE INDEX idx_chapters_course ON chapters(course_id);
```

### Pages Table
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES pages(id) ON DELETE CASCADE, -- For nested folder structure
  title VARCHAR(255) NOT NULL,
  page_type ENUM('markdown', 'video', 'quiz') NOT NULL,
  order_index INTEGER NOT NULL,

  -- Type-specific foreign keys (only one should be populated)
  markdown_id UUID REFERENCES markdown_content(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT page_type_check CHECK (
    (page_type = 'markdown' AND markdown_id IS NOT NULL AND video_id IS NULL AND quiz_id IS NULL) OR
    (page_type = 'video' AND video_id IS NOT NULL AND markdown_id IS NULL AND quiz_id IS NULL) OR
    (page_type = 'quiz' AND quiz_id IS NOT NULL AND markdown_id IS NULL AND video_id IS NULL)
  )
);

CREATE INDEX idx_pages_chapter ON pages(chapter_id);
CREATE INDEX idx_pages_parent ON pages(parent_page_id);
CREATE INDEX idx_pages_type ON pages(page_type);
```

### Markdown Content Table
```sql
CREATE TABLE markdown_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Videos Table (Mux Integration)
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Mux-specific fields
  mux_asset_id VARCHAR(255) UNIQUE NOT NULL,
  mux_playback_id VARCHAR(255) NOT NULL,
  mux_status ENUM('preparing', 'ready', 'errored') DEFAULT 'preparing',

  -- Video metadata (populated from Mux)
  duration_seconds INTEGER,
  aspect_ratio VARCHAR(10),
  max_resolution VARCHAR(20),

  -- Upload tracking
  uploaded_by_clerk_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_videos_mux_asset ON videos(mux_asset_id);
CREATE INDEX idx_videos_mux_playback ON videos(mux_playback_id);
CREATE INDEX idx_videos_status ON videos(mux_status);
```

### Quizzes Table
```sql
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quiz_type ENUM('predefined', 'ai_generated') NOT NULL DEFAULT 'predefined',
  association_type ENUM('page', 'chapter', 'course', 'standalone') NOT NULL,

  -- Association foreign keys (only one should be populated based on association_type)
  associated_page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  associated_chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  associated_course_id UUID REFERENCES courses(id) ON DELETE CASCADE,

  access_level ENUM('free', 'pro') NOT NULL DEFAULT 'free',
  time_limit_minutes INTEGER,
  passing_score_percentage DECIMAL(5,2) DEFAULT 70.00,

  created_by_clerk_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT quiz_association_check CHECK (
    (association_type = 'page' AND associated_page_id IS NOT NULL) OR
    (association_type = 'chapter' AND associated_chapter_id IS NOT NULL) OR
    (association_type = 'course' AND associated_course_id IS NOT NULL) OR
    (association_type = 'standalone' AND associated_page_id IS NULL AND associated_chapter_id IS NULL AND associated_course_id IS NULL)
  )
);

CREATE INDEX idx_quizzes_type ON quizzes(quiz_type);
CREATE INDEX idx_quizzes_association ON quizzes(association_type);
CREATE INDEX idx_quizzes_access_level ON quizzes(access_level);
CREATE INDEX idx_quizzes_creator ON quizzes(created_by_clerk_id);
```

### Quiz Questions Table
```sql
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice', 'true_false', 'short_answer', 'essay') NOT NULL,
  order_index INTEGER NOT NULL,
  points DECIMAL(5,2) DEFAULT 1.00,
  explanation TEXT, -- Optional explanation shown after answering
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(quiz_id, order_index)
);

CREATE INDEX idx_questions_quiz ON quiz_questions(quiz_id);
```

### Quiz Answer Options Table
```sql
CREATE TABLE quiz_answer_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_options_question ON quiz_answer_options(question_id);
```

### Quiz Attempts Table (Critical for AI Agent)
```sql
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Attempt metadata
  attempt_number INTEGER NOT NULL, -- Track multiple attempts per user
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  time_taken_seconds INTEGER,

  -- Scoring
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER DEFAULT 0,
  score_percentage DECIMAL(5,2) DEFAULT 0.00,
  points_earned DECIMAL(10,2) DEFAULT 0.00,
  points_possible DECIMAL(10,2) NOT NULL,
  passed BOOLEAN DEFAULT false,

  -- Context for AI analysis (denormalized for easier querying)
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_attempts_course ON quiz_attempts(course_id);
CREATE INDEX idx_attempts_chapter ON quiz_attempts(chapter_id);
CREATE INDEX idx_attempts_score ON quiz_attempts(score_percentage);
CREATE INDEX idx_attempts_completed ON quiz_attempts(completed_at);
```

### Quiz Attempt Answers Table (Detailed tracking for AI)
```sql
CREATE TABLE quiz_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_answer_options(id) ON DELETE SET NULL,
  answer_text TEXT, -- For short_answer and essay types
  is_correct BOOLEAN,
  points_earned DECIMAL(5,2) DEFAULT 0.00,
  time_spent_seconds INTEGER,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attempt_answers_attempt ON quiz_attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question ON quiz_attempt_answers(question_id);
CREATE INDEX idx_attempt_answers_correct ON quiz_attempt_answers(is_correct);
```

### Teacher Course Assignments Table
```sql
CREATE TABLE teacher_course_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_clerk_id VARCHAR(255) NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by_clerk_id VARCHAR(255) NOT NULL,
  UNIQUE(teacher_clerk_id, course_id)
);

CREATE INDEX idx_teacher_assignments_teacher ON teacher_course_assignments(teacher_clerk_id);
CREATE INDEX idx_teacher_assignments_course ON teacher_course_assignments(course_id);
```

### Page Progress Tracking Table
```sql
CREATE TABLE page_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, page_id)
);

CREATE INDEX idx_progress_user ON page_progress(user_id);
CREATE INDEX idx_progress_page ON page_progress(page_id);
```

### Video Watch Progress Table (Mux Analytics Integration)
```sql
CREATE TABLE video_watch_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,

  -- Playback tracking
  last_position_seconds INTEGER DEFAULT 0,
  total_watch_time_seconds INTEGER DEFAULT 0,
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  completed BOOLEAN DEFAULT false,

  -- Mux video view ID for detailed analytics
  mux_view_id VARCHAR(255),

  last_watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, video_id)
);

CREATE INDEX idx_video_progress_user ON video_watch_progress(user_id);
CREATE INDEX idx_video_progress_video ON video_watch_progress(video_id);
CREATE INDEX idx_video_progress_mux_view ON video_watch_progress(mux_view_id);
```

### Chatbot Conversations Table
```sql
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_type ENUM('global', 'course_specific') NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE, -- NULL for global chats
  title VARCHAR(255), -- Auto-generated from first message
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user ON chatbot_conversations(user_id);
CREATE INDEX idx_conversations_course ON chatbot_conversations(course_id);
CREATE INDEX idx_conversations_type ON chatbot_conversations(conversation_type);
```

### Chatbot Messages Table
```sql
CREATE TABLE chatbot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB, -- Store context references, quiz_ids generated, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_conversation ON chatbot_messages(conversation_id);
CREATE INDEX idx_messages_created ON chatbot_messages(created_at);
CREATE INDEX idx_messages_metadata ON chatbot_messages USING gin(metadata);
```

---

## User Roles & Permissions

### Role Management via Clerk

```typescript
// Clerk metadata management
async function updateUserRole(clerkId: string, role: UserRole) {
  await clerkClient.users.updateUserMetadata(clerkId, {
    publicMetadata: {
      role: role,
      subscription_tier: role === 'pro_student' ? 'pro' : 'free'
    }
  });
}

async function getUserRole(clerkId: string): Promise<UserRole> {
  const user = await clerkClient.users.getUser(clerkId);
  return user.publicMetadata.role as UserRole || 'free_student';
}

enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  PRO_STUDENT = 'pro_student',
  FREE_STUDENT = 'free_student'
}
```

### Permission Matrix

| Feature | Admin | Teacher | Pro Student | Free Student |
|---------|-------|---------|-------------|--------------|
| View all users (via Clerk) | ✅ | ❌ | ❌ | ❌ |
| Manage user roles | ✅ | ❌ | ❌ | ❌ |
| Create courses | ✅ | ✅ | ❌ | ❌ |
| Edit any course | ✅ | ❌ | ❌ | ❌ |
| Edit assigned courses | ✅ | ✅ | ❌ | ❌ |
| Upload videos to Mux | ✅ | ✅ | ❌ | ❌ |
| Create/edit quizzes | ✅ | ✅ | ❌ | ❌ |
| Access free courses | ✅ | ✅ | ✅ | ✅ |
| Access pro courses | ✅ | ✅ | ✅ | ❌ |
| Access global chatbot | ✅ | ✅ | ✅ | ❌ |
| Access course chatbot | ✅ | ✅ | ✅ | ❌ |
| Generate AI quizzes | ✅ | ✅ | ✅ | ❌ |
| Take free quizzes | ✅ | ✅ | ✅ | ✅ |
| Take pro quizzes | ✅ | ✅ | ✅ | ❌ |
| View own analytics | ✅ | ✅ | ✅ | ✅ |
| View all analytics | ✅ | ✅ (assigned) | ❌ | ❌ |

---

## API Routes & Protection

### Clerk Middleware Integration

```typescript
import { clerkMiddleware, getAuth } from '@clerk/nextjs/server';

// Middleware to get user from Clerk and sync with database
async function requireAuth(req) {
  const { userId: clerkId } = getAuth(req);
  if (!clerkId) throw new Error('Unauthorized');

  // Ensure user exists in our database
  const user = await ensureUserExists(clerkId);
  return { clerkId, user };
}

async function requireRole(req, allowedRoles: UserRole[]) {
  const { clerkId } = await requireAuth(req);
  const role = await getUserRole(clerkId);

  if (!allowedRoles.includes(role)) {
    throw new Error('Forbidden');
  }

  return { clerkId, role };
}

async function requireProAccess(req) {
  return await requireRole(req, ['admin', 'teacher', 'pro_student']);
}

// Ensure user exists in database (called via Clerk webhook or on first request)
async function ensureUserExists(clerkId: string) {
  let user = await db.users.findOne({ clerk_id: clerkId });

  if (!user) {
    user = await db.users.create({
      clerk_id: clerkId,
      created_at: new Date()
    });
  }

  return user;
}
```

### Clerk Webhook Endpoints

```typescript
// POST /api/webhooks/clerk
// Handles user.created, user.updated, user.deleted events
interface ClerkWebhookEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted';
  data: {
    id: string; // clerk_id
    email_addresses: Array<{ email_address: string }>;
    first_name: string;
    last_name: string;
    public_metadata: any;
  };
}
```

### Public Routes (No Authentication)

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/` | Landing page | None |
| GET | `/pricing` | Pricing plans | None |
| GET | `/sign-in` | Clerk sign in (redirects to Clerk) | None |
| GET | `/sign-up` | Clerk sign up (redirects to Clerk) | None |
| POST | `/api/webhooks/clerk` | Clerk user sync webhook | Webhook signature verification |
| POST | `/api/webhooks/mux` | Mux video status webhook | Webhook signature verification |

### Student Dashboard Routes

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/overview` | Student statistics | `requireAuth` |
| GET | `/api/dashboard/stats` | Get user stats | `requireAuth` |

### Course Browsing & Enrollment

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/courses` | User's enrolled courses | `requireAuth` |
| GET | `/dashboard/courses/browse` | Browse course catalog | `requireAuth` |
| GET | `/api/courses` | List all courses | `requireAuth` |
| GET | `/api/courses/:id` | Get course details | `requireAuth` + access check |
| POST | `/api/courses/:id/enroll` | Enroll in course | `requireAuth` + access level check |
| DELETE | `/api/courses/:id/enroll` | Unenroll from course | `requireAuth` |

### Learning Interface Routes

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/learning/:courseId/overview` | Course dashboard | `requireAuth` + course access |
| GET | `/dashboard/learning/:courseId/chat` | Course chatbot | `requireAuth` + course access + `requireProAccess` |
| GET | `/dashboard/learning/:courseId/quizes` | Course quizzes | `requireAuth` + course access |
| GET | `/dashboard/learning/:courseId/content/:chapterId/:pageId` | Learning content | `requireAuth` + course access |
| GET | `/api/courses/:courseId/chapters` | Get course chapters | `requireAuth` + course access |
| GET | `/api/courses/:courseId/progress` | Get course progress | `requireAuth` + course access |
| PUT | `/api/pages/:pageId/progress` | Update page progress | `requireAuth` |
| PUT | `/api/videos/:videoId/progress` | Update video progress | `requireAuth` |

### Video Playback Routes (Mux Integration)

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/api/videos/:videoId/playback` | Get Mux playback info | `requireAuth` + page access |
| POST | `/api/videos/:videoId/track-view` | Track video view start | `requireAuth` |
| PUT | `/api/videos/:videoId/update-progress` | Update watch position | `requireAuth` |

### Quiz Routes

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/quizes` | Standalone quiz library | `requireAuth` |
| GET | `/api/quizzes` | List available quizzes | `requireAuth` |
| GET | `/api/quizzes/:id` | Get quiz details | `requireAuth` + access check |
| POST | `/api/quizzes/:id/start` | Start quiz attempt | `requireAuth` + access check |
| POST | `/api/quizzes/attempts/:attemptId/answer` | Submit answer | `requireAuth` + owner check |
| POST | `/api/quizzes/attempts/:attemptId/complete` | Complete quiz | `requireAuth` + owner check |
| GET | `/api/quizzes/attempts/:attemptId` | Get attempt results | `requireAuth` + owner check |
| GET | `/api/users/me/quiz-attempts` | Get current user's attempts | `requireAuth` |
| GET | `/api/quizzes/:quizId/attempts` | Get all attempts for quiz | `requireRole(['admin', 'teacher'])` |

### Chatbot Routes

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/chat` | Global chatbot interface | `requireAuth` + `requireProAccess` |
| POST | `/api/chat/message` | Send global chat message | `requireAuth` + `requireProAccess` |
| POST | `/api/chat/course/:courseId/message` | Send course chat message | `requireAuth` + `requireProAccess` + course access |
| GET | `/api/chat/conversations` | Get user conversations | `requireAuth` + `requireProAccess` |
| POST | `/api/chat/generate-quiz` | Generate AI quiz | `requireAuth` + `requireProAccess` |

### Admin - User Management (via Clerk)

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/admin/users` | User management page | `requireRole(['admin'])` |
| GET | `/api/admin/users` | List users (from Clerk) | `requireRole(['admin'])` |
| GET | `/api/admin/users/:clerkId` | Get user details | `requireRole(['admin'])` |
| PUT | `/api/admin/users/:clerkId/role` | Change user role | `requireRole(['admin'])` |
| DELETE | `/api/admin/users/:clerkId` | Delete user (via Clerk) | `requireRole(['admin'])` |

### Admin/Teacher - Course Management

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/admin/courses` | Course management | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/courses/new` | Course creation | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/courses/:id` | Course edit | `requireRole(['admin', 'teacher'])` + assignment check |
| POST | `/api/admin/courses` | Create course | `requireRole(['admin', 'teacher'])` |
| PUT | `/api/admin/courses/:id` | Update course | `requireRole(['admin', 'teacher'])` + assignment check |
| DELETE | `/api/admin/courses/:id` | Delete course | `requireRole(['admin'])` |
| POST | `/api/admin/courses/:id/chapters` | Add chapter | `requireRole(['admin', 'teacher'])` + assignment check |
| PUT | `/api/admin/courses/:courseId/chapters/:chapterId` | Update chapter | `requireRole(['admin', 'teacher'])` + assignment check |
| DELETE | `/api/admin/courses/:courseId/chapters/:chapterId` | Delete chapter | `requireRole(['admin', 'teacher'])` + assignment check |
| POST | `/api/admin/courses/:id/assign-teacher` | Assign teacher | `requireRole(['admin'])` |

### Admin/Teacher - Quiz Management

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/admin/quiz` | Quiz management | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/quiz/new` | Quiz creation | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/quiz/:id` | Quiz edit | `requireRole(['admin', 'teacher'])` + creator check |
| POST | `/api/admin/quizzes` | Create quiz | `requireRole(['admin', 'teacher'])` |
| PUT | `/api/admin/quizzes/:id` | Update quiz | `requireRole(['admin', 'teacher'])` + creator check |
| DELETE | `/api/admin/quizzes/:id` | Delete quiz | `requireRole(['admin', 'teacher'])` + creator check |
| POST | `/api/admin/quizzes/:id/questions` | Add question | `requireRole(['admin', 'teacher'])` + creator check |
| PUT | `/api/admin/quizzes/:quizId/questions/:questionId` | Update question | `requireRole(['admin', 'teacher'])` + creator check |
| DELETE | `/api/admin/quizzes/:quizId/questions/:questionId` | Delete question | `requireRole(['admin', 'teacher'])` + creator check |

### Admin/Teacher - Video Management (Mux)

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/admin/video` | Video management | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/video/new` | Video upload | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/video/:id` | Video edit | `requireRole(['admin', 'teacher'])` |
| GET | `/api/admin/videos` | List videos | `requireRole(['admin', 'teacher'])` |
| POST | `/api/admin/videos/upload-url` | Get Mux direct upload URL | `requireRole(['admin', 'teacher'])` |
| POST | `/api/admin/videos` | Create video record | `requireRole(['admin', 'teacher'])` |
| PUT | `/api/admin/videos/:id` | Update video metadata | `requireRole(['admin', 'teacher'])` |
| DELETE | `/api/admin/videos/:id` | Delete video (and Mux asset) | `requireRole(['admin'])` |

### Admin/Teacher - Page Management

| Method | Route | Description | Protection |
|--------|-------|-------------|------------|
| GET | `/dashboard/admin/page` | Page management | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/page/new` | Create page | `requireRole(['admin', 'teacher'])` |
| GET | `/dashboard/admin/page/:id` | Edit page | `requireRole(['admin', 'teacher'])` |
| GET | `/api/admin/pages` | List pages | `requireRole(['admin', 'teacher'])` |
| POST | `/api/admin/pages` | Create page | `requireRole(['admin', 'teacher'])` |
| PUT | `/api/admin/pages/:id` | Update page | `requireRole(['admin', 'teacher'])` |
| DELETE | `/api/admin/pages/:id` | Delete page | `requireRole(['admin'])` |
| PUT | `/api/admin/pages/:id/move` | Move page (folder) | `requireRole(['admin', 'teacher'])` |

---

## Business Logic

### Clerk User Sync (Webhook Handler)

```typescript
// Webhook handler for Clerk events
async function handleClerkWebhook(event: ClerkWebhookEvent) {
  switch (event.type) {
    case 'user.created':
      await createUserInDatabase(event.data.id);
      // Set default role in Clerk metadata
      await updateUserRole(event.data.id, 'free_student');
      break;

    case 'user.updated':
      // Update last_login or other tracked fields
      await updateUserLastLogin(event.data.id);
      break;

    case 'user.deleted':
      // Clean up user data (cascade delete handles most)
      await deleteUserFromDatabase(event.data.id);
      break;
  }
}

async function createUserInDatabase(clerkId: string) {
  await db.users.create({
    clerk_id: clerkId,
    created_at: new Date()
  });
}

async function deleteUserFromDatabase(clerkId: string) {
  const user = await db.users.findOne({ clerk_id: clerkId });
  if (user) {
    await db.users.delete({ id: user.id });
  }
}
```

### Mux Video Integration

```typescript
import Mux from '@mux/mux-node';
const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET,
});

// 1. Get direct upload URL for video upload
async function createDirectUpload() {
  const upload = await mux.video.uploads.create({
    new_asset_settings: {
      playback_policy: ['signed'], // Require signed URLs for playback
      encoding_tier: 'baseline',
    },
    cors_origin: process.env.NEXT_PUBLIC_APP_URL,
  });

  return {
    uploadUrl: upload.url,
    uploadId: upload.id,
  };
}

// 2. Handle Mux webhook when video is ready
async function handleMuxWebhook(event: any) {
  if (event.type === 'video.asset.ready') {
    const assetId = event.data.id;
    const playbackId = event.data.playback_ids[0].id;

    await db.videos.update(
      { mux_asset_id: assetId },
      {
        mux_playback_id: playbackId,
        mux_status: 'ready',
        duration_seconds: event.data.duration,
        aspect_ratio: event.data.aspect_ratio,
        max_resolution: event.data.max_stored_resolution,
      }
    );
  }

  if (event.type === 'video.asset.errored') {
    const assetId = event.data.id;
    await db.videos.update(
      { mux_asset_id: assetId },
      { mux_status: 'errored' }
    );
  }
}

// 3. Generate signed playback URL
async function getVideoPlaybackUrl(videoId: string, userId: string) {
  const video = await db.videos.findById(videoId);

  // Check user has access to the page containing this video
  await verifyUserHasVideoAccess(userId, videoId);

  // Generate signed URL (expires in 24 hours)
  const token = jwt.sign(
    {
      sub: video.mux_playback_id,
      aud: 'v',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      kid: process.env.MUX_SIGNING_KEY_ID,
    },
    Buffer.from(process.env.MUX_SIGNING_KEY_PRIVATE_KEY, 'base64'),
    { algorithm: 'RS256' }
  );

  return {
    playbackId: video.mux_playback_id,
    token: token,
    playbackUrl: `https://stream.mux.com/${video.mux_playback_id}.m3u8?token=${token}`,
  };
}

// 4. Track video view with Mux Data
async function trackVideoView(videoId: string, userId: string) {
  const video = await db.videos.findById(videoId);
  const user = await getUserFromClerkId(userId);

  // Mux automatically tracks via player, but we can enhance with metadata
  return {
    video_id: videoId,
    viewer_user_id: userId,
    // These will be passed to Mux Player for analytics
    metadata: {
      video_id: videoId,
      video_title: video.title,
      viewer_user_id: userId,
    },
  };
}
```

### Video Upload Flow

```typescript
// Complete video upload workflow
async function uploadVideoWorkflow(clerkId: string, metadata: any) {
  // 1. Get direct upload URL from Mux
  const { uploadUrl, uploadId } = await createDirectUpload();

  // 2. Create video record in database (status: preparing)
  const video = await db.videos.create({
    title: metadata.title,
    description: metadata.description,
    mux_asset_id: uploadId, // Temporarily store upload ID
    mux_status: 'preparing',
    uploaded_by_clerk_id: clerkId,
  });

  // 3. Return upload URL to client
  // Client uploads video directly to Mux using this URL
  return {
    videoId: video.id,
    uploadUrl: uploadUrl,
  };

  // 4. Mux webhook will update status when ready (handleMuxWebhook)
}
```

### Quiz Attempt Tracking

```typescript
async function startQuizAttempt(userId: string, quizId: string) {
  const user = await db.users.findById(userId);
  const quiz = await db.quizzes.findById(quizId);

  // Check access
  await verifyQuizAccess(user, quiz);

  // Get attempt number
  const previousAttempts = await db.quiz_attempts.count({
    user_id: userId,
    quiz_id: quizId,
  });

  // Get context for AI
  const context = await getQuizContext(quizId);

  // Create attempt
  const attempt = await db.quiz_attempts.create({
    quiz_id: quizId,
    user_id: userId,
    attempt_number: previousAttempts + 1,
    total_questions: await db.quiz_questions.count({ quiz_id: quizId }),
    points_possible: await calculateTotalPoints(quizId),
    course_id: context.courseId,
    chapter_id: context.chapterId,
    started_at: new Date(),
  });

  return attempt;
}

async function recordAnswer(attemptId: string, questionId: string, answer: any) {
  const question = await db.quiz_questions.findById(questionId);
  const isCorrect = await evaluateAnswer(question, answer);
  const pointsEarned = isCorrect ? question.points : 0;

  await db.quiz_attempt_answers.create({
    attempt_id: attemptId,
    question_id: questionId,
    selected_option_id: answer.optionId,
    answer_text: answer.text,
    is_correct: isCorrect,
    points_earned: pointsEarned,
    answered_at: new Date(),
  });
}

async function completeQuizAttempt(attemptId: string) {
  const answers = await db.quiz_attempt_answers.find({ attempt_id: attemptId });
  const correctCount = answers.filter(a => a.is_correct).length;
  const totalPoints = answers.reduce((sum, a) => sum + a.points_earned, 0);
  const scorePercentage = (correctCount / answers.length) * 100;

  const attempt = await db.quiz_attempts.findById(attemptId);
  const quiz = await db.quizzes.findById(attempt.quiz_id);
  const passed = scorePercentage >= quiz.passing_score_percentage;

  const timeTaken = Math.floor((Date.now() - attempt.started_at.getTime()) / 1000);

  await db.quiz_attempts.update(attemptId, {
    completed_at: new Date(),
    time_taken_seconds: timeTaken,
    correct_answers: correctCount,
    score_percentage: scorePercentage,
    points_earned: totalPoints,
    passed: passed,
  });

  // Update course progress
  if (attempt.course_id) {
    await updateCourseProgress(attempt.user_id, attempt.course_id);
  }

  return { scorePercentage, passed, correctCount };
}
```

### AI Performance Analysis Queries

```sql
-- Get user weak areas for personalized quiz generation
SELECT
  c.title as chapter_title,
  co.title as course_title,
  AVG(qa.score_percentage) as avg_score,
  COUNT(qa.id) as attempt_count
FROM quiz_attempts qa
JOIN quizzes q ON qa.quiz_id = q.id
LEFT JOIN chapters c ON qa.chapter_id = c.id
LEFT JOIN courses co ON qa.course_id = co.id
WHERE qa.user_id = $1
  AND qa.completed_at IS NOT NULL
GROUP BY c.id, co.id
HAVING AVG(qa.score_percentage) < 70
ORDER BY avg_score ASC
LIMIT 10;

-- Question-level performance for targeted practice
SELECT
  qq.question_text,
  qq.question_type,
  COUNT(qaa.id) as times_answered,
  SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END) as correct_count,
  CAST(SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(qaa.id) * 100 as success_rate
FROM quiz_attempt_answers qaa
JOIN quiz_attempts qa ON qaa.attempt_id = qa.id
JOIN quiz_questions qq ON qaa.question_id = qq.id
WHERE qa.user_id = $1
GROUP BY qq.id
HAVING CAST(SUM(CASE WHEN qaa.is_correct THEN 1 ELSE 0 END) AS FLOAT) / COUNT(qaa.id) < 0.5
ORDER BY success_rate ASC;
```

### Access Control with Clerk

```typescript
async function canAccessCourse(clerkId: string, courseId: string): Promise<boolean> {
  const role = await getUserRole(clerkId);
  const course = await db.courses.findById(courseId);

  // Admins access everything
  if (role === 'admin') return true;

  // Teachers access assigned courses
  if (role === 'teacher') {
    const assignment = await db.teacher_course_assignments.findOne({
      teacher_clerk_id: clerkId,
      course_id: courseId,
    });
    return !!assignment;
  }

  // Students check access level
  if (course.access_level === 'free') return true;
  if (course.access_level === 'pro' && role === 'pro_student') return true;

  return false;
}

async function canEditCourse(clerkId: string, courseId: string): Promise<boolean> {
  const role = await getUserRole(clerkId);

  if (role === 'admin') return true;

  if (role === 'teacher') {
    const assignment = await db.teacher_course_assignments.findOne({
      teacher_clerk_id: clerkId,
      course_id: courseId,
    });
    return !!assignment;
  }

  return false;
}
```

---

## Environment Variables

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Mux
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
MUX_SIGNING_KEY_ID=...
MUX_SIGNING_KEY_PRIVATE_KEY=...
MUX_WEBHOOK_SECRET=...

# Database
DATABASE_URL=postgresql://...

# App
NEXT_PUBLIC_APP_URL=https://your-app.com
```

---

## Additional Notes

### Clerk Integration
- Use Clerk webhooks to sync user creation/deletion
- Store role in Clerk `publicMetadata`
- Use Clerk's session tokens for authentication
- Leverage Clerk's user management UI for admin dashboard

### Mux Integration
- Use Mux Direct Uploads for client-side video upload
- Implement signed playback URLs for security
- Use Mux Player SDK for best video experience
- Track video analytics via Mux Data
- Handle webhook events for video processing status

### Security
- All video playback URLs are signed and expire
- Course access verified on every request
- Quiz attempts tied to authenticated users
- Webhook signatures verified for Clerk and Mux

### Performance
- Cache Clerk user data in application layer
- Index all foreign keys
- Monitor quiz_attempts table growth
- Use CDN (via Mux) for video delivery
- Consider read replicas for analytics queries

This specification provides a production-ready foundation for building the LMS with Clerk authentication and Mux video hosting.