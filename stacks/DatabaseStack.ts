import { StackContext } from "sst/constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cdk from "aws-cdk-lib";

export function DatabaseStack({ stack }: StackContext) {
  // Create a VPC for the database
  const vpc = new ec2.Vpc(stack, "DatabaseVPC", {
    maxAzs: 2,
    natGateways: 0, // To save costs
  });

  // Create security group for the database
  const securityGroup = new ec2.SecurityGroup(stack, "DatabaseSecurityGroup", {
    vpc,
    description: "Allow database access",
    allowAllOutbound: true,
  });
  
  // Allow inbound on port 5432 from within VPC
  securityGroup.addIngressRule(
    ec2.Peer.ipv4(vpc.vpcCidrBlock),
    ec2.Port.tcp(5432),
    "Allow PostgreSQL access from within VPC"
  );

  // Create the database credentials secret
  const databaseCredentialsSecret = new secretsmanager.Secret(stack, "DBCredentialsSecret", {
    secretName: `${stack.stage}-${stack.name}-db-credentials`,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({
        username: "postgres",
      }),
      excludePunctuation: true,
      includeSpace: false,
      generateStringKey: "password",
    },
  });

  // Create the RDS instance using a generic engine version
  const dbInstance = new rds.DatabaseInstance(stack, "PostgreSQLInstance", {
    engine: rds.DatabaseInstanceEngine.postgres({
      version: rds.PostgresEngineVersion.VER_12, // Use a major version only
    }),
    vpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
    },
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.T3, 
      ec2.InstanceSize.SMALL
    ),
    allocatedStorage: 20,
    maxAllocatedStorage: 100,
    securityGroups: [securityGroup],
    credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
    databaseName: "projectmanagement",
    backupRetention: cdk.Duration.days(7),
    deletionProtection: false,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  // Output the database connection information
  stack.addOutputs({
    DatabaseSecretArn: databaseCredentialsSecret.secretArn,
    DatabaseEndpoint: dbInstance.dbInstanceEndpointAddress,
    DatabasePort: dbInstance.dbInstanceEndpointPort,
  });

  return {
    instance: dbInstance,
    secret: databaseCredentialsSecret,
  };
}