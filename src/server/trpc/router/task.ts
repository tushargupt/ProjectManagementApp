export const taskRouter = router({
    // Get tasks for the authenticated user getUserTasks: protectedProcedure
    .input(
        z.object({
          status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
          projectId: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        try {
          return await ctx.prisma.task.findMany({
            where: {
              OR: [
                { assignedToId: ctx.session.user.id },
                { project: { 
                  teamMembers: { 
                    some: { userId: ctx.session.user.id } 
                  } 
                } }
              ],
              ...(input?.status && { status: input.status }),
              ...(input?.projectId && { projectId: input.projectId }),
            },
            include: {
              project: true,
              assignedTo: true,
            },
            orderBy: [
              { status: 'asc' },
              { dueDate: 'asc' }
            ],
            take: 20 // Limit to 20 most recent/relevant tasks
          });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch tasks',
          });
        }
      }),
  
    // Create a new task
    createTask: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        title: z.string().min(1, 'Task title is required'),
        description: z.string().optional(),
        status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional().default('BACKLOG'),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
        assignedToId: z.string().optional(),
        dueDate: z.date().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // First, verify user has access to the project
          const project = await ctx.prisma.project.findUnique({
            where: { id: input.projectId },
            include: { teamMembers: true }
          });
  
          if (!project) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Project not found',
            });
          }
  
          // Check if user is a team member
          const isTeamMember = project.teamMembers.some(
            member => member.userId === ctx.session.user.id
          );
  
          if (!isTeamMember) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a member of this project',
            });
          }
  
          // Create task
          return await ctx.prisma.task.create({
            data: {
              title: input.title,
              description: input.description,
              status: input.status,
              priority: input.priority,
              project: { connect: { id: input.projectId } },
              ...(input.assignedToId && { 
                assignedTo: { connect: { id: input.assignedToId } } 
              }),
              dueDate: input.dueDate,
              // Handle tags
              ...(input.tags && input.tags.length > 0 && {
                tags: {
                  connectOrCreate: input.tags.map(tagName => ({
                    where: { name: tagName },
                    create: { name: tagName }
                  }))
                }
              })
            },
            include: {
              project: true,
              assignedTo: true,
              tags: true
            }
          });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task',
          });
        }
      }),
  
    // Update an existing task
    updateTask: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        assignedToId: z.string().optional().nullable(),
        dueDate: z.date().optional().nullable(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // First, find the task and check project membership
          const task = await ctx.prisma.task.findUnique({
            where: { id: input.taskId },
            include: { 
              project: { 
                include: { teamMembers: true } 
              } 
            }
          });
  
          if (!task) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Task not found',
            });
          }
  
          // Check if user is a team member
          const isTeamMember = task.project.teamMembers.some(
            member => member.userId === ctx.session.user.id
          );
  
          if (!isTeamMember) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a member of this project',
            });
          }
  
          // Prepare update data
          const updateData: any = { ...input };
          delete updateData.taskId;
          delete updateData.tags;
  
          // Update task
          const updatedTask = await ctx.prisma.task.update({
            where: { id: input.taskId },
            data: {
              ...updateData,
              ...(input.assignedToId === null && { assignedToId: null }),
              ...(input.tags && {
                tags: {
                  // Disconnect existing tags
                  set: [],
                  // Connect or create new tags
                  connectOrCreate: input.tags.map(tagName => ({
                    where: { name: tagName },
                    create: { name: tagName }
                  }))
                }
              })
            },
            include: {
              project: true,
              assignedTo: true,
              tags: true
            }
          });
  
          return updatedTask;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update task',
          });
        }
      }),
  
    // Delete a task
    deleteTask: protectedProcedure
      .input(z.object({
        taskId: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Find the task and check project membership
          const task = await ctx.prisma.task.findUnique({
            where: { id: input.taskId },
            include: { 
              project: { 
                include: { teamMembers: true } 
              } 
            }
          });
  
          if (!task) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Task not found',
            });
          }
  
          // Check if user is a team member
          const isTeamMember = task.project.teamMembers.some(
            member => member.userId === ctx.session.user.id
          );
  
          if (!isTeamMember) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You are not a member of this project',
            });
          }
  
          // Delete the task
          return await ctx.prisma.task.delete({
            where: { id: input.taskId }
          });
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete task',
          });
        }
      }),
  
    // Get task details
    getTaskById: protectedProcedure
      .input(z.object({
        taskId: z.string()
      }))
      .query(async ({ ctx, input }) => {
        try {
          const task = await ctx.prisma.task.findUnique({
            where: { id: input.taskId },
            include: {
              project: {
                include: { teamMembers: { include: { user: true } } }
              },
              assignedTo: true,
              comments: {
                include: { author: true },
                orderBy: { createdAt: 'desc' }
              },
              tags: true
            }
          });
  
          if (!task) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Task not found',
            });
          }
  
          // Check if user is a team member of the project
          const isTeamMember = task.project.teamMembers.some(
            member => member.userId === ctx.session.user.id
          );
  
          if (!isTeamMember) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have access to this task',
            });
          }
  
          return task;
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to fetch task details',
          });
        }
      }),
  });