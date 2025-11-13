import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// POST /api/seed-data - Seed sample data for development
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const results = await Promise.allSettled([
      seedCourses(),
      seedChaptersAndLessons(),
      seedSampleContent(),
    ]);

    const success = results.every(result => result.status === 'fulfilled');

    return NextResponse.json({
      success,
      message: success
        ? 'Sample data seeded successfully'
        : 'Some data seeding failed. Check logs for details.',
      results: results.map(r => r.status === 'fulfilled' ? 'success' : r.reason),
    });
  } catch (error) {
    console.error('Seed data error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function seedCourses() {
  const courses = [
    {
      title: 'Mathematics: Algebra and Functions',
      description: 'Master the fundamentals of algebra, linear equations, quadratic functions, and more with comprehensive examples and practice problems.',
      subject: 'mathematics',
      level: 'gcse',
      instructor: 'Dr. Sarah Johnson',
      duration: 2400, // 40 hours
      difficulty: 'intermediate',
      topics: ['algebra', 'functions', 'equations', 'graphs'],
      price: 0,
      status: 'published',
      enrollmentCount: 127,
      rating: 4.7,
    },
    {
      title: 'English Literature: Shakespeare and Poetry',
      description: 'Explore the works of Shakespeare, analyze poetry, and develop critical reading and writing skills essential for GCSE English.',
      subject: 'english',
      level: 'gcse',
      instructor: 'Prof. Michael Chen',
      duration: 1800, // 30 hours
      difficulty: 'intermediate',
      topics: ['shakespeare', 'poetry', 'analysis', 'writing'],
      price: 0,
      status: 'published',
      enrollmentCount: 89,
      rating: 4.5,
    },
    {
      title: 'Science: Biology Fundamentals',
      description: 'Comprehensive coverage of GCSE Biology including cells, organisms, ecosystems, and human biology with practical experiments.',
      subject: 'science',
      level: 'gcse',
      instructor: 'Dr. Emma Wilson',
      duration: 2100, // 35 hours
      difficulty: 'beginner',
      topics: ['cells', 'organisms', 'ecosystems', 'human-biology'],
      price: 0,
      status: 'published',
      enrollmentCount: 156,
      rating: 4.8,
    },
    {
      title: 'Mathematics: Geometry and Trigonometry',
      description: 'Master geometric concepts, trigonometric functions, and spatial reasoning with real-world applications.',
      subject: 'mathematics',
      level: 'gcse',
      instructor: 'Dr. James Taylor',
      duration: 1800, // 30 hours
      difficulty: 'advanced',
      topics: ['geometry', 'trigonometry', 'spatial-reasoning', 'measurement'],
      price: 0,
      status: 'published',
      enrollmentCount: 92,
      rating: 4.6,
    },
    {
      title: 'Physics: Forces and Energy',
      description: 'Explore the fundamental principles of physics including motion, forces, energy, and electricity with hands-on experiments.',
      subject: 'science',
      level: 'gcse',
      instructor: 'Dr. Robert Martinez',
      duration: 2000, // 33 hours
      difficulty: 'intermediate',
      topics: ['forces', 'motion', 'energy', 'electricity', 'waves'],
      price: 0,
      status: 'published',
      enrollmentCount: 78,
      rating: 4.4,
    },
    {
      title: 'History: World War I and II',
      description: 'In-depth study of the World Wars, their causes, major events, and lasting impact on modern society.',
      subject: 'history',
      level: 'gcse',
      instructor: 'Prof. Elizabeth Brown',
      duration: 1600, // 27 hours
      difficulty: 'intermediate',
      topics: ['world-war-1', 'world-war-2', 'international-relations', 'modern-history'],
      price: 0,
      status: 'published',
      enrollmentCount: 45,
      rating: 4.3,
    },
  ];

  const createdCourses = await Promise.all(
    courses.map(course =>
      prisma.course.create({
        data: course,
      })
    )
  );

  return createdCourses;
}

async function seedChaptersAndLessons() {
  const courses = await prisma.course.findMany();

  for (const course of courses) {
    const chapters = [];
    const chapterCount = 4; // Each course gets 4 chapters

    for (let i = 1; i <= chapterCount; i++) {
      const chapter = await prisma.chapter.create({
        data: {
          courseId: course.id,
          title: `Chapter ${i}: ${getChapterTitle(course.subject, i)}`,
          description: `Comprehensive coverage of ${getChapterTitle(course.subject, i).toLowerCase()} concepts and applications.`,
          order: i,
          duration: 600, // 10 hours per chapter
          isPublished: true,
        },
      });

      chapters.push(chapter);

      // Add lessons to each chapter
      const lessonCount = 5; // Each chapter gets 5 lessons
      for (let j = 1; j <= lessonCount; j++) {
        await prisma.lesson.create({
          data: {
            chapterId: chapter.id,
            title: `Lesson ${j}: ${getLessonTitle(course.subject, i, j)}`,
            description: `Detailed exploration of ${getLessonTitle(course.subject, i, j).toLowerCase()} with examples and practice.`,
            order: j,
            duration: 120, // 2 hours per lesson
            hasVideo: true,
            hasMarkdown: true,
            isPublished: true,
            videoUrl: `https://example.com/videos/${course.id}/${chapter.id}/lesson-${j}.mp4`,
            markdownPath: `/content/${course.subject.toLowerCase()}/chapter-${i}/lesson-${j}.md`,
          },
        });
      }
    }
  }

  return chapters;
}

async function seedSampleContent() {
  // This function could seed sample markdown content
  // For now, we'll just return success since the markdown paths are set above
  return { message: 'Content paths seeded' };
}

function getChapterTitle(subject: string, chapterNumber: number): string {
  const titles: Record<string, string[]> = {
    mathematics: [
      'Foundations and Number Systems',
      'Algebraic Expressions and Equations',
      'Advanced Algebra and Functions',
      'Geometry and Problem Solving',
    ],
    english: [
      'Introduction to Literary Analysis',
      'Shakespearean Drama',
      'Poetry and Creative Writing',
      'Critical Reading and Essay Writing',
    ],
    science: [
      'Cell Biology and Life Processes',
      'Organisms and Ecosystems',
      'Human Biology and Health',
      'Environmental Science and Sustainability',
    ],
    history: [
      'Pre-War Europe and Global Context',
      'World War I: Causes and Major Events',
      'The Interwar Period and Rise of Fascism',
      'World War II and Post-War Consequences',
    ],
  };

  return titles[subject]?.[chapterNumber - 1] || `Module ${chapterNumber}`;
}

function getLessonTitle(subject: string, chapterNumber: number, lessonNumber: number): string {
  const lessonTitles: Record<string, Record<number, string[]>> = {
    mathematics: {
      1: ['Number Systems and Properties', 'Basic Operations', 'Fractions and Decimals', 'Percentages and Ratios', 'Problem Solving Strategies'],
      2: ['Introduction to Variables', 'Linear Equations', 'Inequalities', 'Systems of Equations', 'Word Problems'],
      3: ['Functions and Relations', 'Quadratic Functions', 'Exponential Functions', 'Logarithmic Functions', 'Advanced Topics'],
      4: ['Basic Geometry Concepts', 'Triangles and Circles', 'Coordinate Geometry', 'Trigonometry Basics', 'Proofs and Constructions'],
    },
    english: {
      1: ['Literary Devices and Techniques', 'Character Analysis', 'Plot Structure', 'Setting and Atmosphere', 'Critical Reading Skills'],
      2: ['Introduction to Shakespeare', 'Romeo and Juliet', 'Macbeth', 'Historical Context', 'Language and Style'],
      3: ['Poetic Forms and Devices', 'Metaphor and Simile', 'Narrative Poetry', 'Analysis Techniques', 'Creative Writing'],
      4: ['Essay Structure', 'Argumentative Writing', 'Descriptive Writing', 'Comparative Analysis', 'Exam Preparation'],
    },
    science: {
      1: ['Cell Structure and Function', 'Cell Processes', 'Microorganisms', 'Tissues and Organs', 'Experimental Methods'],
      2: ['Classification of Living Things', 'Food Chains and Webs', 'Ecosystems', 'Adaptation', 'Evolution Basics'],
      3: ['Human Body Systems', 'Circulatory System', 'Respiratory System', 'Nervous System', 'Health and Disease'],
      4: ['Climate Change', 'Pollution', 'Conservation', 'Sustainable Development', 'Environmental Ethics'],
    },
    history: {
      1: ['European Alliances', 'Imperialism', 'Nationalism', 'Military Technology', 'Diplomatic Relations'],
      2: ['Archduke Assassination', 'Western Front', 'Eastern Front', 'Global Conflict', 'War End and Treaty'],
      3: ['Treaty of Versailles', 'Economic Depression', 'Rise of Dictators', 'Appeasement Policy', 'Path to War'],
      4: ['Blitzkrieg and Early War', 'Turning Points', 'Home Front', 'Holocaust', 'War Conclusion'],
    },
  };

  return lessonTitles[subject]?.[chapterNumber]?.[lessonNumber - 1] || `Topic ${lessonNumber}`;
}