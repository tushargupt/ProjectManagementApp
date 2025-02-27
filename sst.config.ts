// sst.config.ts
import { SSTConfig } from "sst";
import { NextStack } from "./stacks/NextStack";
import { DatabaseStack } from "./stacks/DatabaseStack";
import { CacheStack } from "./stacks/CacheStack";
import { AuthStack } from "./stacks/AuthStack";

export default {
  config(_input) {
    return {
      name: "project-management-app",
      region: "us-east-1",
      stage: process.env.STAGE || "dev"
    };
  },
  stacks(app) {
    // Set default runtime for all stacks
    app.setDefaultFunctionProps({
      runtime: "nodejs18.x",
      architecture: "arm64"
    });

    // Configure stages
    if (app.stage !== "prod") {
      app.setDefaultRemovalPolicy("destroy");
    }

    // Add stacks
    app
      .stack(DatabaseStack)
      .stack(CacheStack)
      .stack(AuthStack)
      .stack(NextStack);
  }
} satisfies SSTConfig;