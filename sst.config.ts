import { SSTConfig } from "sst";
import { AuthStack } from "./stacks/AuthStack";
import { CacheStack } from "./stacks/CacheStack";
import { DatabaseStack } from "./stacks/DatabaseStack";
import { NextStack } from "./stacks/NextStack";

export default {
    config(_input) {
      return {
        name: "project-management-app",
        region: "ap-south-1",
      };
    },
    stacks(app) {
      app.stack(AuthStack);
      app.stack(CacheStack);
      app.stack(DatabaseStack);
      // Comment out NextStack to skip frontend deployment
      // app.stack(NextStack);
    },
  } satisfies SSTConfig;
