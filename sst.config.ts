// sst.config.ts
import { SSTConfig } from "sst";
import { NextjsSite } from "sst/constructs";
import { Config } from "sst/constructs";

export default {
  config(_input) {
    return {
      name: "project-management-app",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(function Site({ stack }) {
      // Define your environment secrets
      const DATABASE_URL = new Config.Secret(stack, "DATABASE_URL");
      const DIRECT_URL = new Config.Secret(stack, "DIRECT_URL");
      const NEXTAUTH_SECRET = new Config.Secret(stack, "NEXTAUTH_SECRET");
      const NEXTAUTH_URL = new Config.Secret(stack, "NEXTAUTH_URL");
      const NEXT_PUBLIC_SUPABASE_URL = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_URL");
      const NEXT_PUBLIC_SUPABASE_ANON_KEY = new Config.Secret(stack, "NEXT_PUBLIC_SUPABASE_ANON_KEY");

      // Create the Next.js site
      const site = new NextjsSite(stack, "site", {
        path: ".",
        environment: {
          // Pass secrets to your site
          DATABASE_URL: DATABASE_URL.value,
          DIRECT_URL: DIRECT_URL.value,
          NEXTAUTH_SECRET: NEXTAUTH_SECRET.value,
          NEXTAUTH_URL: NEXTAUTH_URL.value,
          NEXT_PUBLIC_SUPABASE_URL: NEXT_PUBLIC_SUPABASE_URL.value,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: NEXT_PUBLIC_SUPABASE_ANON_KEY.value,
        },
      });

      // Add the site's URL to stack outputs
      stack.addOutputs({
        SiteUrl: site.url,
      });
    });
  },
} satisfies SSTConfig;