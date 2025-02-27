// src/app/api/debug-session/route.ts
import { NextResponse } from 'next/server';
import { getAuthSession } from '~/server/auth';

export async function GET() {
  try {
    const session = await getAuthSession();
    
    return NextResponse.json({
      hasSession: !!session,
      sessionDetails: session ? {
        userId: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        // Don't include sensitive data
      } : null,
      expires: session?.expires,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}