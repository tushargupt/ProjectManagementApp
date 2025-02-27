/ tests/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../src/server/db';

describe('Authentication Functionality', () => {
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

let testUser: { email: string; password: string };

beforeAll(() => {
  testUser = {
    email: `test_auth_${Date.now()}@example.com`,
    password: 'StrongTestPassword123!'
  };
});

afterAll(async () => {
  // Clean up test user from Supabase and Prisma
  await supabase.auth.admin.deleteUser(testUser.email);
  await prisma.user.deleteMany({
    where: { email: testUser.email }
  });
});

it('should create a new user in Supabase and Prisma', async () => {
  // Sign up user in Supabase
  const { data, error } = await supabase.auth.signUp({
    email: testUser.email,
    password: testUser.password
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();
  expect(data.user?.email).toBe(testUser.email);

  // Verify user exists in Prisma
  const prismaUser = await prisma.user.findUnique({
    where: { email: testUser.email }
  });

  expect(prismaUser).toBeDefined();
  expect(prismaUser?.email).toBe(testUser.email);
});

it('should authenticate an existing user', async () => {
  // First, create the user
  await supabase.auth.signUp({
    email: testUser.email,
    password: testUser.password
  });

  // Then attempt to sign in
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password
  });

  expect(error).toBeNull();
  expect(data.user).toBeDefined();
  expect(data.user?.email).toBe(testUser.email);
});

it('should fail authentication with incorrect credentials', async () => {
  // Attempt to sign in with incorrect password
  const { data, error } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: 'WrongPassword123!'
  });

  expect(data.user).toBeNull();
  expect(error).toBeDefined();
  expect(error?.message).toContain('Invalid login credentials');
});
});