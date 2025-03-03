import { NextjsSite, Config, StackContext } from "sst/constructs";

export function MyStack({ stack }: StackContext) {
  const DATABASE_URL = new Config.Secret(stack, "DATABASE_URL");
  const DIRECT_URL = new Config.Secret(stack, "DIRECT_URL");
  const NEXTAUTH_SECRET = new Config.Secret(stack, "NEXTAUTH_SECRET");
  const NEXTAUTH_URL = new Config.Secret(stack, "NEXTAUTH_URL");
  const NEXT_PUBLIC_SUPABASE_URL = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_URL");
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  stack.addOutputs({
    DATABASE_URL: DATABASE_URL.value,
    DIRECT_URL: DIRECT_URL.value,
  });
}
