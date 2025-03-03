import { createRequire as topLevelCreateRequire } from 'module';const require = topLevelCreateRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// stacks/AuthStack.ts
import { Auth } from "sst/constructs";
function AuthStack({ stack }) {
  const auth = new Auth(stack, "Auth", {
    authenticator: {
      handler: "src/functions/authenticator.handler",
      environment: {
        SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
      }
    },
    providers: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
      }
    }
  });
  stack.addOutputs({
    AuthDomain: auth.authDomain
  });
  return auth;
}
__name(AuthStack, "AuthStack");

// stacks/CacheStack.ts
import { Cache } from "sst/constructs";
function CacheStack({ stack }) {
  const cache = new Cache(stack, "AppCache", {
    cluster: {
      engine: "redis",
      version: "7.x",
      nodeType: "cache.t3.micro"
    }
  });
  stack.addOutputs({
    CacheEndpoint: cache.clusterEndpoint.hostname,
    CachePort: cache.clusterEndpoint.port
  });
  return cache;
}
__name(CacheStack, "CacheStack");

// stacks/DatabaseStack.ts
import { RDS } from "sst/constructs";
function DatabaseStack({ stack }) {
  const database = new RDS(stack, "Database", {
    engine: "postgresql13.9",
    defaultDatabaseName: "projectmanagement",
    scaling: {
      maxCapacity: "ACU_2",
      minCapacity: "ACU_1"
    },
    backup: {
      retention: 7
    },
    monitoring: true
  });
  stack.addOutputs({
    DatabaseEndpoint: database.clusterEndpoint.hostname,
    DatabasePort: database.clusterEndpoint.port
  });
  return database;
}
__name(DatabaseStack, "DatabaseStack");

// stacks/NextStack.ts
import { NextjsSite } from "sst/constructs";
function NextStack({ stack, app }) {
  const site = new NextjsSite(stack, "Site", {
    path: "./",
    environment: {
      DATABASE_URL: process.env.DATABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
      NEXTAUTH_URL: app.stage === "prod" ? "https://yourdomain.com" : "http://localhost:3000",
      NODE_ENV: app.stage === "prod" ? "production" : "development"
    },
    ...app.stage === "prod" && {
      customDomain: {
        domainName: "yourdomain.com",
        hostedZone: "yourdomain.com"
      }
    },
    serverless: {
      memory: 3008,
      timeout: 30
    }
  });
  stack.addOutputs({
    SiteUrl: site.url,
    ...app.stage === "prod" && {
      CustomDomain: site.customDomainUrl
    }
  });
  return site;
}
__name(NextStack, "NextStack");
export {
  AuthStack,
  CacheStack,
  DatabaseStack,
  NextStack
};
//# sourceMappingURL=index.js.map
