// src/server/api/routers/user.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = createTRPCRouter({
  getProfile: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;
      
      try {
        const user = await prisma.user.findUnique({
          where: {
            id: session.user.id,
          },
        });
        
        return user;
      } catch (error) {
        console.error("Error fetching user profile:", error);
        throw new Error("Failed to fetch user profile");
      }
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      department: z.string().optional(),
      phoneNumber: z.string().optional(),
      image: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      
      try {
        const updatedUser = await prisma.user.update({
          where: {
            id: session.user.id,
          },
          data: input,
        });
        
        return updatedUser;
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw new Error("Failed to update user profile");
      }
    }),

  getNotifications: protectedProcedure
    .input(z.object({
      limit: z.number().optional(),
      cursor: z.string().optional(),
      onlyUnread: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { limit = 10, cursor, onlyUnread = false } = input;
      
      try {
        const notifications = await prisma.notification.findMany({
          where: {
            userId: session.user.id,
            ...(onlyUnread ? { isRead: false } : {}),
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: limit + 1, // take an extra item to determine if there are more
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        });
        
        let nextCursor: typeof cursor | undefined = undefined;
        if (notifications.length > limit) {
          const nextItem = notifications.pop();
          nextCursor = nextItem?.id;
        }
        
        return {
          notifications,
          nextCursor,
        };
      } catch (error) {
        console.error("Error fetching notifications:", error);
        throw new Error("Failed to fetch notifications");
      }
    }),

  markNotificationAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { notificationId } = input;
      
      try {
        // First check if the notification belongs to the current user
        const notification = await prisma.notification.findUnique({
          where: { id: notificationId },
        });
        
        if (!notification || notification.userId !== session.user.id) {
          throw new Error("Notification not found or access denied");
        }
        
        const updatedNotification = await prisma.notification.update({
          where: { id: notificationId },
          data: { isRead: true },
        });
        
        return updatedNotification;
      } catch (error) {
        console.error("Error marking notification as read:", error);
        throw new Error("Failed to update notification");
      }
    }),

  markAllNotificationsAsRead: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { session, prisma } = ctx;
      
      try {
        const result = await prisma.notification.updateMany({
          where: {
            userId: session.user.id,
            isRead: false,
          },
          data: {
            isRead: true,
          },
        });
        
        return { count: result.count };
      } catch (error) {
        console.error("Error marking all notifications as read:", error);
        throw new Error("Failed to update notifications");
      }
    }),

  searchUsers: protectedProcedure
    .input(z.object({
      query: z.string(),
      limit: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { query, limit = 10 } = input;
      
      if (!query || query.length < 2) {
        return [];
      }
      
      try {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
            ],
            // Don't include the current user in search results
            NOT: { id: session.user.id },
          },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
          },
          take: limit,
        });
        
        return users;
      } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search users");
      }
    }),
});