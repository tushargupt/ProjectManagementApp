import { StackContext } from "sst/constructs";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export function CacheStack({ stack }: StackContext) {
  // Create a VPC for the cache
  const vpc = new ec2.Vpc(stack, "Cache", {
    natGateways: 1,
  });
  
  // Create a Redis cluster
  const subnetGroup = new elasticache.CfnSubnetGroup(stack, "CacheSubnetGroup", {
    description: "Subnet group for Redis cache",
    subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
  });
  
  // Create security group for Redis
  const securityGroup = new ec2.SecurityGroup(stack, "CacheSecurityGroup", {
    vpc,
    description: "Allow access to Redis",
    allowAllOutbound: true,
  });
  
  securityGroup.addIngressRule(
    ec2.Peer.anyIpv4(),
    ec2.Port.tcp(6379),
    "Allow Redis access"
  );
  
  // Create Redis cluster
  const cache = new elasticache.CfnCacheCluster(stack, "AppCache", {
    cacheNodeType: "cache.t3.micro",
    engine: "redis",
    numCacheNodes: 1,
    autoMinorVersionUpgrade: true,
    cacheSubnetGroupName: subnetGroup.ref,
    vpcSecurityGroupIds: [securityGroup.securityGroupId],
    engineVersion: "7.0",
  });
  
  stack.addOutputs({
    CacheEndpoint: cache.attrRedisEndpointAddress,
    CachePort: cache.attrRedisEndpointPort,
  });
  
  return { 
    cluster: cache,
    clusterEndpoint: {
      hostname: cache.attrRedisEndpointAddress,
      port: cache.attrRedisEndpointPort
    }
  };
}