import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔐 Simple sync endpoint called');

  try {
    // Simple response to test if the endpoint works
    return NextResponse.json({
      success: true,
      message: 'Simple sync endpoint working',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Simple sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Simple sync failed' },
      { status: 500 }
    );
  }
}