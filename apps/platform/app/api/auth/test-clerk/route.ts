import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  console.log('🔐 TEST: Clerk test endpoint called');

  try {
    const startTime = Date.now();

    // Test 1: Just auth()
    console.log('🔑 TEST: Testing auth() only...');
    const authStartTime = Date.now();

    try {
      const authResult = await auth();
      const authTime = Date.now() - authStartTime;
      console.log('✅ TEST: auth() completed in', authTime, 'ms');
      console.log('🔑 TEST: auth result:', !!authResult, authResult?.userId ? `userId: ${authResult.userId}` : '');

      // Test 2: Just currentUser()
      console.log('👤 TEST: Testing currentUser() only...');
      const currentUserStartTime = Date.now();

      try {
        const currentUserResult = await currentUser();
        const currentUserTime = Date.now() - currentUserStartTime;
        console.log('✅ TEST: currentUser() completed in', currentUserTime, 'ms');
        console.log('👤 TEST: currentUser result:', !!currentUserResult);

        const totalTime = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          message: 'Clerk test completed successfully',
          timing: {
            auth: authTime,
            currentUser: currentUserTime,
            total: totalTime,
          },
          authResult: {
            hasUserId: !!authResult?.userId,
            userId: authResult?.userId || null,
          },
          currentUserResult: {
            exists: !!currentUserResult,
            hasEmail: !!(currentUserResult?.emailAddresses?.length),
          },
        });

      } catch (currentUserError) {
        console.error('❌ TEST: currentUser() failed after', Date.now() - currentUserStartTime, 'ms:', currentUserError);
        return NextResponse.json({
          success: false,
          error: 'currentUser() failed',
          timing: {
            auth: Date.now() - authStartTime,
            currentUser: Date.now() - currentUserStartTime,
          },
        }, { status: 500 });
      }

    } catch (authError) {
      console.error('❌ TEST: auth() failed after', Date.now() - authStartTime, 'ms:', authError);
      return NextResponse.json({
        success: false,
        error: 'auth() failed',
        timing: {
          auth: Date.now() - authStartTime,
        },
      }, { status: 500 });
    }

  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('💥 TEST: Clerk test failed after', totalTime, 'ms:', error);
    return NextResponse.json({
      success: false,
      error: 'Clerk test failed',
      timing: { total: totalTime }
    }, { status: 500 });
  }
}