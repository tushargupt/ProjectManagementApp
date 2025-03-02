import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import NextAuthSessionProvider from '~/providers/SessionProvider';
import TRPCProvider from '~/providers/TRPCProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Management App',
  description: 'A powerful project management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthSessionProvider>
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}