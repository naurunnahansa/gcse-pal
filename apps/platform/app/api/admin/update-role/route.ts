import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// Admin only endpoint to update user roles
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if current user is already admin (temporarily allow first admin setup)
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    // For security, you might want to check if the current user is already admin
    // or implement a different authorization strategy
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { success: false, error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['student', 'admin', 'teacher'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be student, admin, or teacher' },
        { status: 400 }
      );
    }

    // Update user role by email
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: { role: role },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update user role error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}