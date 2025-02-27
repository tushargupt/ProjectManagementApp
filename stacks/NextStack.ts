import { StackContext, NextjsSite } from "sst/constructs";

export function NextStack({ stack, app }: StackContext) {
  const site = new NextjsSite(stack, "Site", {
    path: "./",
    environment: {
      // Database Configuration
      DATABASE_URL: process.env.DATABASE_URL || "",
      
      // Supabase Configuration
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      
      // Authentication Configuration
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
      NEXTAUTH_URL: app.stage === "prod" 
        ? "https://yourdomain.com" 
        : "http://localhost:3000",
      
      // Environment-specific configuration
      NODE_ENV: app.stage === "prod" ? "production" : "development",
    },
    
    // Custom domains for production
    ...(app.stage === "prod" && {
      customDomain: {
        domainName: "yourdomain.com",
        hostedZone: "yourdomain.com"
      }
    }),

    // Optional: configure server-side rendering
    serverless: {
      // Adjust memory and timeout for complex operations
      memory: 3008,
      timeout: 30,
    }
  });

  // Add outputs for easy reference
  stack.addOutputs({
    SiteUrl: site.url,
    ...(app.stage === "prod" && { 
      CustomDomain: site.customDomainUrl 
    }),
  });

  return site;
}