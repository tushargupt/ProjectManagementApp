// src/server/api/routers/task.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const taskRouter = createTRPCRouter({
  getUserTasks: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;
      
      try {
        const tasks = await prisma.task.findMany({
          where: {
            assignedToId: session.user.id,
          },
          include: {
            project: true,
            comments: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 3,
            },
            tags: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        return tasks;
      } catch (error) {
        console.error("Error fetching user tasks:", error);
        throw new Error("Failed to fetch tasks");
      }
    }),

  getTaskById: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { taskId } = input;
      
      try {
        const task = await prisma.task.findUnique({
          where: {
            id: taskId,
          },
          include: {
            project: true,
            assignedTo: true,
            comments: {
              include: {
                author: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            tags: true,
          },
        });
        
        return task;
      } catch (error) {
        console.error("Error fetching task:", error);
        throw new Error("Failed to fetch task details");
      }
    }),

  getProjectTasks: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { projectId } = input;
      
      try {
        const tasks = await prisma.task.findMany({
          where: {
            projectId,
          },
          include: {
            assignedTo: true,
            tags: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        return tasks;
      } catch (error) {
        console.error("Error fetching project tasks:", error);
        throw new Error("Failed to fetch project tasks");
      }
    }),

  createTask: protectedProcedure
    .input(z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      projectId: z.string(),
      status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      assignedToId: z.string().optional(),
      startDate: z.date().optional(),
      dueDate: z.date().optional(),
      estimatedHours: z.number().optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { tagIds, ...data } = input;
      
      try {
        // Create the task
        const newTask = await prisma.task.create({
          data: {
            ...data,
            status: data.status || 'BACKLOG',
            priority: data.priority || 'MEDIUM',
            // Connect tags if provided
            tags: tagIds?.length ? {
              connect: tagIds.map(id => ({ id })),
            } : undefined,
          },
        });
        
        // If the task is assigned to someone, create a notification
        if (data.assignedToId) {
          await prisma.notification.create({
            data: {
              type: 'TASK_ASSIGNED',
              message: `You have been assigned to the task: ${data.title}`,
              userId: data.assignedToId,
              taskId: newTask.id,
              projectId: data.projectId,
            },
          });
        }
        
        return newTask;
      } catch (error) {
        console.error("Error creating task:", error);
        throw new Error("Failed to create task");
      }
    }),

  updateTask: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1, "Title is required").optional(),
      description: z.string().optional(),
      status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      assignedToId: z.string().optional(),
      startDate: z.date().optional(),
      dueDate: z.date().optional(),
      estimatedHours: z.number().optional(),
      actualHours: z.number().optional(),
      completedAt: z.date().optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { id, tagIds, ...data } = input;
      
      // First get the current task to check permissions and track changes
      const currentTask = await prisma.task.findUnique({
        where: { id },
        include: { project: true },
      });
      
      if (!currentTask) {
        throw new Error("Task not found");
      }
      
      // Check if the user can update this task (project owner, admin, or the assigned user)
      const canEdit = await prisma.teamMembership.findFirst({
        where: {
          userId: session.user.id,
          projectId: currentTask.projectId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });
      
      if (!canEdit && currentTask.assignedToId !== session.user.id) {
        throw new Error("You don't have permission to update this task");
      }
      
      // Update the task
      try {
        // Handle tag updates if provided
        const updateData: any = { ...data };
        
        if (tagIds !== undefined) {
          // Disconnect all existing tags and connect the new ones
          updateData.tags = {
            set: [], // Disconnect all existing tags
            connect: tagIds.map(id => ({ id })),
          };
        }
        
        // If the status is being changed to DONE, automatically set completedAt
        if (data.status === 'DONE' && currentTask.status !== 'DONE') {
          updateData.completedAt = new Date();
        }
        
        const updatedTask = await prisma.task.update({
          where: { id },
          data: updateData,
        });
        
        // If the assignee has changed, create a notification for the new assignee
        if (data.assignedToId && data.assignedToId !== currentTask.assignedToId) {
          await prisma.notification.create({
            data: {
              type: 'TASK_ASSIGNED',
              message: `You have been assigned to the task: ${currentTask.title}`,
              userId: data.assignedToId,
              taskId: id,
              projectId: currentTask.projectId,
            },
          });
        }
        
        // If the status has changed, create a notification for relevant users
        if (data.status && data.status !== currentTask.status) {
          // Notify project owner
          await prisma.notification.create({
            data: {
              type: 'TASK_UPDATED',
              message: `Task "${currentTask.title}" status changed to ${data.status}`,
              userId: currentTask.project.ownerId,
              taskId: id,
              projectId: currentTask.projectId,
            },
          });
        }
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task:", error);
        throw new Error("Failed to update task");
      }
    }),

  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { taskId } = input;
      
      // First get the current task to check permissions
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true },
      });
      
      if (!task) {
        throw new Error("Task not found");
      }
      
      // Check if the user can delete this task (project owner or admin)
      const canDelete = await prisma.teamMembership.findFirst({
        where: {
          userId: session.user.id,
          projectId: task.projectId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });
      
      if (!canDelete) {
        throw new Error("You don't have permission to delete this task");
      }
      
      // Delete the task
      try {
        await prisma.task.delete({
          where: { id: taskId },
        });
        
        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        throw new Error("Failed to delete task");
      }
    }),

  addComment: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      content: z.string().min(1, "Comment cannot be empty"),
      parentCommentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { taskId, content, parentCommentId } = input;
      
      try {
        const comment = await prisma.comment.create({
          data: {
            content,
            author: {
              connect: { id: session.user.id },
            },
            task: {
              connect: { id: taskId },
            },
            parentComment: parentCommentId
              ? { connect: { id: parentCommentId } }
              : undefined,
          },
        });
        
        // Get the task to notify the assigned user
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { title: true, assignedToId: true, projectId: true },
        });
        
        // Create a notification for the task assignee if it's not the comment author
        if (task?.assignedToId && task.assignedToId !== session.user.id) {
          await prisma.notification.create({
            data: {
              type: 'COMMENT_MENTION',
              message: `New comment on task "${task.title}"`,
              userId: task.assignedToId,
              taskId,
              projectId: task.projectId,
            },
          });
        }
        
        return comment;
      } catch (error) {
        console.error("Error adding comment:", error);
        throw new Error("Failed to add comment");
      }
    }),
});