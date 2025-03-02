import { StackContext, RDS } from "sst/constructs";

export function DatabaseStack({ stack }: StackContext) {
  const database = new RDS(stack, "Database", {
    engine: "postgresql13.9",
    defaultDatabaseName: "projectmanagement",
    scaling: {
      maxCapacity: "ACU_2",
      minCapacity: "ACU_1",
    },
    // Enable automated backups
    backup: {
      retention: 7, // days
    },
    // Optional: Configure monitoring
    monitoring: true,
  });

  // Export database endpoint for other stacks
  stack.addOutputs({
    DatabaseEndpoint: database.clusterEndpoint.hostname,
    DatabasePort: database.clusterEndpoint.port,
  });

  return database;
}