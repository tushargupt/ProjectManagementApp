// src/app/api/debug/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '~/server/db';

export async function GET() {
  try {
    // Test if Prisma client is working
    const userCount = await prisma.user.count();
    
    // Check if required models exist
    const tableNames = Object.keys(prisma).filter(
      key => typeof prisma[key as keyof typeof prisma] === 'object' 
             && 'findUnique' in (prisma[key as keyof typeof prisma] as any)
    );
    
    return NextResponse.json({
      status: 'ok',
      prismaInitialized: !!prisma,
      userCount,
      availableModels: tableNames,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}