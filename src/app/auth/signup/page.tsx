// src/app/auth/signup/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth';
import SignUpComponent from './SignUpComponent';

export default async function SignUpPage() {
  const session = await getServerSession(authOptions);

  // Redirect to dashboard if already authenticated
  if (session) {
    redirect('/dashboard');
  }

  return <SignUpComponent />;
}