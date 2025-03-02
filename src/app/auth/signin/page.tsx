// src/app/auth/signin/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '~/server/auth';
import SignInComponent from './SignInComponent';

// Use the any type to bypass the type checking issues
export default async function SignInPage(props: any) {
  const { searchParams = {} } = props;
  const session = await getServerSession(authOptions);

  // Log the current session state
  console.log("SignIn page session check:", {
    hasSession: !!session,
    error: searchParams.error,
    callbackUrl: searchParams.callbackUrl,
  });

  // Redirect to dashboard if already authenticated
  if (session) {
    console.log("Session found, redirecting to dashboard");
    return redirect('/dashboard');
  }

  return (
    <SignInComponent 
      error={searchParams.error}
      callbackUrl={searchParams.callbackUrl || '/dashboard'}
    />
  );
}