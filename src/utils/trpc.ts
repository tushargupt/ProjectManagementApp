// src/utils/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '~/server/api/root'; // Adjust this path to where your AppRouter is defined

export const trpc = createTRPCReact<AppRouter>();