// src/server/trpc/router/user.ts
import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  // Get current user profile
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
            skills: true,
            department: true,
            phoneNumber: true,
            teamMemberships: {
              include: {
                project: true
              }
            },
            tasks: {
              include: {
                project: true
              },
              take: 10,
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        });

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User profile not found',
          });
        }

        return user;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch user profile',
        });
      }
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      department: z.string().optional(),
      phoneNumber: z.string()
        .regex(/^[0-9]{10}$/, 'Phone number must be 10 digits')
        .optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try
      {
        const updatedUser = await ctx.prisma.user.update({
          where: { id: ctx.session.user.id },
          data: {
            ...(input.name && { name: input.name }),
            ...(input.bio && { bio: input.bio }),
            ...(input.skills && { skills: input.skills }),
            ...(input.department && { department: input.department }),
            ...(input.phoneNumber && { phoneNumber: input.phoneNumber }),
          },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            skills: true,
            department: true,
            phoneNumber: true,
          }
        });

        return updatedUser;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update user profile',
        });
      }
    }),

  // Get user notifications
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const { limit, cursor } = input;

        const notifications = await ctx.prisma.notification.findMany({
          where: { userId: ctx.session.user.id },
          take: limit + 1, // get one more to check if there's a next page
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'desc' },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (notifications.length > limit) {
          const nextItem = notifications.pop(); // remove the last item
          nextCursor = nextItem!.id;
        }

        return {
          notifications,
          nextCursor,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch notifications',
        });
      }
    }),

  // Mark notifications as read
  markNotificationsAsRead: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()).optional(),
        markAll: z.boolean().optional().default(false)
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.markAll) {
          // Mark all notifications as read
          await ctx.prisma.notification.updateMany({
            where: { 
              userId: ctx.session.user.id,
              isRead: false 
            },
            data: { isRead: true }
          });
        } else if (input.notificationIds && input.notificationIds.length > 0) {
          // Mark specific notifications as read
          await ctx.prisma.notification.updateMany({
            where: { 
              id: { in: input.notificationIds },
              userId: ctx.session.user.id 
            },
            data: { isRead: true }
          });
        }

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark notifications as read',
        });
      }
    }),

  // Get user's recent activity
  getRecentActivity: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // Fetch recent tasks
        const recentTasks = await ctx.prisma.task.findMany({
          where: {
            OR: [
              { assignedToId: ctx.session.user.id },
              { project: { 
                teamMembers: { 
                  some: { userId: ctx.session.user.id } 
                } 
              } }
            ]
          },
          include: {
            project: true,
            assignedTo: true
          },
          orderBy: { updatedAt: 'desc' },
          take: input.limit
        });

        // Fetch recent project involvements
        const recentProjects = await ctx.prisma.teamMembership.findMany({
          where: { userId: ctx.session.user.id },
          include: {
            project: true
          },
          orderBy: { joinedAt: 'desc' },
          take: input.limit
        });

        return {
          recentTasks,
          recentProjects: recentProjects.map(membership => membership.project)
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent activity',
        });
      }
    }),
});