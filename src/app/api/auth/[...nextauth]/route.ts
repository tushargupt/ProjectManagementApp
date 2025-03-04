// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "~/server/db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Your existing authorize function
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lsajozglwespaxozzogt.supabase.co",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzYWpvemdsd2VzcGF4b3p6b2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NDAyMTMsImV4cCI6MjA1NjIxNjIxM30.3svgPmXOSGz-W0ssSkM7ykCGNt-nuN42-ST3BMKrOZE"
          );

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error) {
            console.error("Supabase Authentication Error:", error);
            return null;
          }

          if (data.user) {
            const user = await prisma.user.upsert({
              where: { email: data.user.email! },
              update: {},
              create: {
                email: data.user.email!,
                name: data.user.user_metadata?.name || data.user.email?.split('@')[0],
              },
            });
            
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
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.userId as string,
        };
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "t1eBJy5qztcoc3KhWxBREKZfEHYHhogZemZ7CSdayoY=",
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };