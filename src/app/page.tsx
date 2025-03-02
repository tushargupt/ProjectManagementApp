import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Project Management App
        </h1>
        <p className="text-gray-600 mb-8">
          Streamline your project workflow and team collaboration
        </p>
        <div className="space-y-4">
          <Link 
            href="/auth/signin" 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-300"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}