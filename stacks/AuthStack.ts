import { StackContext, Auth } from "sst/constructs";

export function AuthStack({ stack }: StackContext) {
  const auth = new Auth(stack, "Auth", {
    authenticator: {
      handler: "src/functions/authenticator.handler",
      environment: {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      },
    },
    
    // Configure authentication providers
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },
  });

  stack.addOutputs({
    AuthDomain: auth.authDomain,
  });

  return auth;
}