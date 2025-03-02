import { StackContext, Cache } from "sst/constructs";

export function CacheStack({ stack }: StackContext) {
  const cache = new Cache(stack, "AppCache", {
    cluster: {
      // Configure Redis cache
      engine: "redis",
      version: "7.x",
      nodeType: "cache.t3.micro",
    },
  });

  stack.addOutputs({
    CacheEndpoint: cache.clusterEndpoint.hostname,
    CachePort: cache.clusterEndpoint.port,
  });

  return cache;
}