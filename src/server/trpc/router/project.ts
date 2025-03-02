import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

export const projectRouter = router({
  // Get all projects for the authenticated user
  getUserProjects: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await ctx.prisma.project.findMany({
          where: {
            OR: [
              { ownerId: ctx.session.user.id },
              { teamMembers: { some: { userId: ctx.session.user.id } } }
            ]
          },
          orderBy: { startDate: 'desc' }
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects',
        });
      }
    }),

  // Create a new project
  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1, 'Project name is required'),
      description: z.string().optional(),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.project.create({
          data: {
            ...input,
            owner: { connect: { id: ctx.session.user.id } },
            // Automatically add the creator as the first team member
            teamMembers: {
              create: {
                user: { connect: { id: ctx.session.user.id } },
                role: 'OWNER'
              }
            }
          }
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project',
        });
      }
    }),

  // Get a specific project by ID
  getProjectById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const project = await ctx.prisma.project.findUnique({
          where: { id: input.projectId },
          include: {
            tasks: true,
            teamMembers: {
              include: { user: true }
            }
          }
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        // Check if user is part of the project
        const isUserMember = project.teamMembers.some(
          member => member.userId === ctx.session.user.id
        );

        if (!isUserMember) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this project',
          });
        }

        return project;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch project details',
        });
      }
    }),

  // Update project details
  updateProject: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { projectId, ...updateData } = input;

      try {
        // First, check if user has permission to update
        const project = await ctx.prisma.project.findUnique({
          where: { id: projectId },
          include: { teamMembers: true }
        });

        if (!project) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Project not found',
          });
        }

        const userRole = project.teamMembers.find(
          member => member.userId === ctx.session.user.id
        )?.role;

        if (!userRole || !['OWNER', 'ADMIN'].includes(userRole)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update this project',
          });
        }

        return await ctx.prisma.project.update({
          where: { id: projectId },
          data: updateData
        });
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update project',
        });
      }
    }),
});