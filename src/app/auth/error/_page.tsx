'use client';

import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
          {error === 'CredentialsSignin' 
            ? 'Invalid email or password' 
            : 'An unexpected error occurred'}
        </div>
      </div>
    </div>
  );
}