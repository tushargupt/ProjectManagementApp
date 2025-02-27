// src/server/trpc/router/_app.ts
import { router } from '../trpc';
import { projectRouter } from './project';
import { taskRouter } from './task';

export const appRouter = router({
  project: projectRouter,
  task: taskRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;