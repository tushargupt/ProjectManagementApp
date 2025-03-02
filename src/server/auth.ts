import { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createClient } from "@supabase/supabase-js";

// Import the Prisma client
import { prisma } from "./db";

// Define auth options with PrismaAdapter
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validate input
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          // Attempt to sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          });

          if (error) {
            console.error("Supabase Authentication Error:", error);
            return null;
          }

          // If successful, return user information
          if (data.user) {
            // Try to find or create user in Prisma
            const user = await prisma.user.upsert({
              where: { email: data.user.email! },
              update: {},
              create: {
                email: data.user.email!,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
              },
            });

            console.log("Authentication successful for user:", user.id);
            
            return {
              id: user.id,
              email: user.email,
              name: user.name,
            };
          }

          return null;
        } catch (err) {
          console.error("Authentication catch block error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add the user ID to the JWT token
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token, user }) {
      // For JWT strategy, use token
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId as string,
        };
      } 
      // For database strategy, use user
      else if (user) {
        session.user = {
          ...session.user,
          id: user.id,
        };
      }
      
      console.log("Session callback called:", {
        hasUser: !!user,
        hasToken: !!token,
        sessionUserId: session.user?.id,
      });
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Use JWT for session handling
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Add debug mode in development
  debug: process.env.NODE_ENV === 'development',
};

// Helper function to get the session in server components
export const getAuthSession = () => getServerSession(authOptions);