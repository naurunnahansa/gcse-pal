import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/courses - Fetch all courses with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(req.url);
    const subject = searchParams.get('subject');
    const level = searchParams.get('level');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter conditions
    const where: any = { status: 'published' };

    if (subject && subject !== 'all') {
      where.subject = subject;
    }

    if (level && level !== 'all') {
      where.level = level;
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructor: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Get courses with pagination
    const courses = await prisma.course.findMany({
      where,
      include: {
        chapters: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format response
    const formattedCourses = courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      subject: course.subject,
      level: course.level,
      thumbnail: course.thumbnail,
      instructor: course.instructor,
      duration: course.duration,
      difficulty: course.difficulty,
      topics: course.topics,
      enrollmentCount: course._count.enrollments,
      rating: course.rating,
      price: course.price,
      chaptersCount: course.chapters.length,
      chapters: course.chapters,
      createdAt: course.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin or teacher
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin or teacher access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      subject,
      level,
      thumbnail,
      instructor,
      duration,
      difficulty,
      topics,
      price,
    } = body;

    if (!title || !description || !subject || !instructor) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        subject,
        level: level || 'gcse',
        thumbnail,
        instructor,
        instructorId: user.id,
        duration: duration || 0,
        difficulty: difficulty || 'beginner',
        topics: topics || [],
        price: price || 0,
        status: 'draft', // Start as draft, need to publish manually
      },
    });

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}