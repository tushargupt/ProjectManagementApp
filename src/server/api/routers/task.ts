import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Reusable Zod schemas
const taskStatus = z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED']);
const taskPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const taskRouter = createTRPCRouter({
  getTaskById: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { taskId } = input;

      try {
        const task = await prisma.task.findUnique({
          where: {
            id: taskId,
          },
          include: {
            project: true,
            assignedTo: true,
            creator: true,
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

        if (!task) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Task not found",
          });
        }

        // Check if user has access to this task's project
        const projectMembership = await prisma.teamMembership.findFirst({
          where: {
            projectId: task.projectId,
            userId: session.user.id,
          },
        });

        if (!projectMembership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this task",
          });
        }

        return task;
      } catch (error) {
        console.error("Error fetching task:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch task details",
        });
      }
    }),

  getProjectTasks: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { projectId } = input;

      try {
        // First, verify the user has access to this project
        const projectMembership = await prisma.teamMembership.findFirst({
          where: {
            projectId,
            userId: session.user.id,
          },
        });

        if (!projectMembership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this project's tasks",
          });
        }

        const tasks = await prisma.task.findMany({
          where: {
            projectId,
          },
          include: {
            assignedTo: true,
            creator: true,
            tags: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return tasks;
      } catch (error) {
        console.error("Error fetching project tasks:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project tasks",
        });
      }
    }),

    // Add this to your task router
addComment: protectedProcedure
.input(z.object({
  taskId: z.string(),
  content: z.string().min(1, "Comment cannot be empty")
}))
.mutation(async ({ ctx, input }) => {
  const { prisma, session } = ctx;
  const { taskId, content } = input;

  try {
    // First check if the task exists and the user has access to it
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Task not found"
      });
    }

    // Check if user has access to the project this task belongs to
    const projectMembership = await prisma.teamMembership.findFirst({
      where: {
        projectId: task.projectId,
        userId: session.user.id
      }
    });

    if (!projectMembership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have access to comment on this task"
      });
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content,
        author: {
          connect: { id: session.user.id }
        },
        task: {
          connect: { id: taskId }
        }
      },
      include: {
        author: true
      }
    });

    // If the task has assignees, notify them about the comment (except the commenter)
    const taskWithAssignees = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedTo: true }
    });

    if (taskWithAssignees?.assignedTo) {
      // Create notifications for assignees (except the commenter)
      const notifications = taskWithAssignees.assignedTo
        .filter(user => user.id !== session.user.id)
        .map(user => ({
          type: 'COMMENT_MENTION',
          message: `New comment on task: ${task.title}`,
          userId: user.id,
          taskId,
          projectId: task.projectId
        }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    return comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to add comment",
      cause: error
    });
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
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
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
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this task",
        });
      }

      // Delete the task
      try {
        await prisma.task.delete({
          where: { id: taskId },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete task",
        });
      }
    }),

  // In task router
  createTask: protectedProcedure
    .input(z.object({
      title: z.string().min(1, "Title is required"),
      description: z.string().optional(),
      projectId: z.string(),
      status: taskStatus.optional().default('TODO'),
      priority: taskPriority.optional().default('MEDIUM'),
      assignedToIds: z.array(z.string()).optional(), // Change to support multiple assignees
      startDate: z.union([
        z.date(),
        z.string().transform((val) => new Date(val))
      ]).optional(),
      dueDate: z.union([
        z.date(), 
        z.string().transform((val) => val ? new Date(val) : undefined)
      ]).optional(),
      estimatedHours: z.number().optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { tagIds, assignedToIds, ...data } = input;
      
      // Verify project access
      const projectMembership = await prisma.teamMembership.findFirst({
        where: {
          projectId: input.projectId,
          userId: session.user.id,
        },
      });

      if (!projectMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to create tasks in this project",
        });
      }
      
      try {
        // Create the task
        const newTask = await prisma.task.create({
          data: {
            title: data.title,
            description: data.description,
            status: data.status,
            priority: data.priority,
            // Add the creator relationship
            creator: {
              connect: { id: session.user.id }
            },
            project: {
              connect: { id: input.projectId }
            },
            // Handle multiple assignees
            ...(assignedToIds && assignedToIds.length > 0 && {
              assignedTo: {
                connect: assignedToIds.map(id => ({ id }))
              }
            }),
            ...(data.startDate && { startDate: data.startDate }),
            ...(data.dueDate && { dueDate: data.dueDate }),
            ...(data.estimatedHours !== undefined && { estimatedHours: data.estimatedHours }),
            // Connect tags if provided
            ...(tagIds?.length && { 
              tags: {
                connect: tagIds.map(id => ({ id })),
              } 
            }),
          },
          include: {
            assignedTo: true, // Include assigned users in the result
          }
        });
        
        // Create notifications for all assigned users
        if (assignedToIds && assignedToIds.length > 0) {
          const notifications = assignedToIds.map(assignedToId => ({
            type: 'TASK_ASSIGNED',
            message: `You have been assigned to the task: ${data.title}`,
            userId: assignedToId,
            taskId: newTask.id,
            projectId: input.projectId,
          }));

          await prisma.notification.createMany({
            data: notifications
          });
        }
        
        return newTask;
      } catch (error) {
        console.error("Error creating task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create task",
          cause: error
        });
      }
    }),

  // Update the getUserTasks query to work with multiple assignees
  getUserTasks: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;

      try {
        const tasks = await prisma.task.findMany({
          where: {
            assignedTo: {
              some: {
                id: session.user.id
              }
            }
          },
          include: {
            project: true,
            creator: true,
            comments: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 3,
            },
            tags: true,
            assignedTo: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return tasks;
      } catch (error) {
        console.error("Error fetching user tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch tasks",
          cause: error
        });
      }
    }),

  // Update task update method to support multiple assignees
  updateTask: protectedProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().min(1, "Title is required").optional(),
      description: z.string().optional(),
      status: taskStatus.optional(),
      priority: taskPriority.optional(),
      assignedToIds: z.array(z.string()).optional(), // Change to support multiple assignees
      startDate: z.union([
        z.date(),
        z.string().transform((val) => new Date(val))
      ]).optional(),
      dueDate: z.union([
        z.date(),
        z.string().transform((val) => val ? new Date(val) : undefined)
      ]).optional(),
      estimatedHours: z.number().optional(),
      actualHours: z.number().optional(),
      completedAt: z.union([
        z.date(),
        z.string().transform((val) => new Date(val))
      ]).optional(),
      tagIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { id, tagIds, assignedToIds, ...data } = input;
      
      // First get the current task to check permissions
      const currentTask = await prisma.task.findUnique({
        where: { id },
        include: { 
          project: true,
          assignedTo: true 
        },
      });
      
      if (!currentTask) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Task not found",
        });
      }
      
      // Check if the user can update this task
      const canEdit = await prisma.teamMembership.findFirst({
        where: {
          userId: session.user.id,
          projectId: currentTask.projectId,
          role: { in: ['OWNER', 'ADMIN'] },
        },
      });
      
      if (!canEdit && !currentTask.assignedTo.some(user => user.id === session.user.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this task",
        });
      }
      
      // Update the task
      try {
        // Prepare update data
        const updateData: any = { ...data };
        
        // Handle tag updates if provided
        if (tagIds !== undefined) {
          updateData.tags = {
            set: [], // Disconnect all existing tags
            connect: tagIds.map(id => ({ id })),
          };
        }
        
        // Handle assignee updates
        if (assignedToIds !== undefined) {
          updateData.assignedTo = {
            set: [], // Disconnect all existing assignees
            connect: assignedToIds.map(id => ({ id })),
          };
        }
        
        // If the status is being changed to DONE, automatically set completedAt
        if (data.status === 'DONE' && currentTask.status !== 'DONE') {
          updateData.completedAt = new Date();
        }
        
        const updatedTask = await prisma.task.update({
          where: { id },
          data: updateData,
          include: {
            assignedTo: true,
          }
        });
        
        // Create notifications for changes in assignees
        if (assignedToIds) {
          // Find newly added assignees
          const newAssigneeIds = assignedToIds.filter(
            id => !currentTask.assignedTo.some(user => user.id === id)
          );
          
          if (newAssigneeIds.length > 0) {
            const notifications = newAssigneeIds.map(assignedToId => ({
              type: 'TASK_ASSIGNED',
              message: `You have been assigned to the task: ${currentTask.title}`,
              userId: assignedToId,
              taskId: id,
              projectId: currentTask.projectId,
            }));

            await prisma.notification.createMany({
              data: notifications
            });
          }
        }
        
        return updatedTask;
      } catch (error) {
        console.error("Error updating task:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update task",
          cause: error
        });
      }
    }),

  // Add a new method to get tasks created by the current user
  getCreatedTasks: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;

      try {
        const tasks = await prisma.task.findMany({
          where: {
            creatorId: session.user.id
          },
          include: {
            project: true,
            assignedTo: true,
            tags: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return tasks;
      } catch (error) {
        console.error("Error fetching created tasks:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch created tasks",
          cause: error
        });
      }
    }),
});