import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;

      try {
        // Find all projects where the user is a team member
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              // Projects owned by the user
              { ownerId: session.user.id },
              // Projects where the user is a team member
              {
                teamMembers: {
                  some: {
                    userId: session.user.id
                  }
                }
              }
            ]
          },
          include: {
            tasks: true,
            teamMembers: {
              include: {
                user: true
              }
            },
            owner: true
          },
          orderBy: {
            startDate: 'desc',
          },
        });

        return projects;
      } catch (error) {
        console.error("Error fetching user projects:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch projects",
          cause: error,
        });
      }
    }),

  getProjectById: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { projectId } = input;

      try {
        const project = await prisma.project.findUnique({
          where: {
            id: projectId,
          },
          include: {
            tasks: true,
            teamMembers: {
              include: {
                user: true,
              },
            },
            documents: true,
          },
        });

        if (!project) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project not found",
          });
        }

        return project;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Error fetching project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project details",
          cause: error,
        });
      }
    }),

  // Update the createProject mutation in your project router
  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      startDate: z.union([
        z.date(),
        z.string().transform((val) => new Date(val))
      ]).optional().default(() => new Date()),
      endDate: z.union([
        z.date(),
        z.string().transform((val) => val ? new Date(val) : undefined)
      ]).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      teamMembers: z.array(
        z.object({
          email: z.string().email(),
          role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'])
        })
      ).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;

      // Add explicit session check
      if (!session?.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a project',
        });
      }

      // Check if the user exists before attempting to create a project
      const userExists = await prisma.user.findUnique({
        where: {
          id: session.user.id
        },
        select: { id: true }
      });

      if (!userExists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      console.log("Creating project with input:", {
        name: input.name,
        description: input.description,
        startDate: input.startDate,
        endDate: input.endDate,
        priority: input.priority,
        userId: session.user.id,
        teamMembers: input.teamMembers
      });

      try {
        // Create project in a transaction to ensure all relationships are created properly
        const result = await prisma.$transaction(async (tx) => {
          // First create the project with the owner relationship
          const project = await tx.project.create({
            data: {
              name: input.name,
              description: input.description,
              startDate: input.startDate || new Date(),
              endDate: input.endDate,
              priority: input.priority || 'MEDIUM',
              status: 'PLANNING',
              owner: {
                connect: {
                  id: session.user.id,
                },
              },
            },
          });

          // Then create the team membership for the owner
          await tx.teamMembership.create({
            data: {
              user: {
                connect: {
                  id: session.user.id,
                },
              },
              project: {
                connect: {
                  id: project.id,
                },
              },
              role: 'OWNER',
            },
          });

          // Add additional team members if provided
          if (input.teamMembers && input.teamMembers.length > 0) {
            for (const member of input.teamMembers) {
              // Find user by email
              const user = await tx.user.findUnique({
                where: { email: member.email },
                select: { id: true }
              });

              if (user) {
                // Add team membership
                await tx.teamMembership.create({
                  data: {
                    user: {
                      connect: { id: user.id }
                    },
                    project: {
                      connect: { id: project.id }
                    },
                    role: member.role,
                  }
                });

                // Create notification for the user
                await tx.notification.create({
                  data: {
                    type: 'PROJECT_INVITE',
                    message: `You have been added to the project: ${project.name}`,
                    userId: user.id,
                    projectId: project.id
                  }
                });
              }
            }
          }

          return project;
        });

        console.log("Project created successfully:", result.id);
        return result;
      } catch (error) {
        console.error("Error creating project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
          cause: error,
        });
      }
    }),

  updateProject: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      endDate: z.union([
        z.date(),
        z.string().transform((val) => new Date(val))
      ]).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
      status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { id, ...data } = input;

      // First check if user has permission to update this project
      const project = await prisma.project.findUnique({
        where: { id },
        include: { teamMembers: true },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check if user is owner or admin
      const userMembership = project.teamMembers.find(
        member => member.userId === session.user.id
      );

      if (!userMembership || (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN')) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this project",
        });
      }

      // Update the project
      try {
        const updatedProject = await prisma.project.update({
          where: { id },
          data,
        });

        return updatedProject;
      } catch (error) {
        console.error("Error updating project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update project",
          cause: error,
        });
      }
    }),

  deleteProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { projectId } = input;

      // First check if user has permission to delete this project
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.ownerId !== session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the project owner can delete a project",
        });
      }

      // Delete the project
      try {
        await prisma.project.delete({
          where: { id: projectId },
        });

        return { success: true };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete project",
          cause: error,
        });
      }
    }),

  // In projectRouter (add this method to the existing router)
  addTeamMember: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      email: z.string().email(),
      role: z.enum(['MEMBER', 'ADMIN', 'VIEWER']).optional().default('MEMBER')
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      const { projectId, email, role } = input;

      try {
        // First, verify the user has permission to add team members
        const projectMembership = await prisma.teamMembership.findFirst({
          where: {
            projectId,
            userId: session.user.id,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        });

        if (!projectMembership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to add team members to this project"
          });
        }

        // Find the user by email
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User with this email does not exist"
          });
        }

        // Check if the user is already a team member
        const existingMembership = await prisma.teamMembership.findUnique({
          where: {
            userId_projectId: {
              userId: user.id,
              projectId
            }
          }
        });

        if (existingMembership) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User is already a member of this project"
          });
        }

        // Add team member
        const newMembership = await prisma.teamMembership.create({
          data: {
            projectId,
            userId: user.id,
            role
          },
          include: {
            user: true
          }
        });

        // Get project details to include the title in the notification
        const projectDetails = await prisma.project.findUnique({
          where: { id: projectId },
          select: { name: true }
        });

        // Create a notification for the added member
        await prisma.notification.create({
          data: {
            type: 'PROJECT_INVITE',
            message: `You have been added to the project: ${projectDetails?.name || 'Unknown Project'}`,
            userId: user.id,
            projectId
          }
        });

        return newMembership;
      } catch (error) {
        console.error("Error adding team member:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add team member",
          cause: error
        });
      }
    }),

  // Add this to your project router

  // Get all members of a specific project (for task assignment)
  getProjectMembers: protectedProcedure
    .input(z.object({
      projectId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { prisma, session } = ctx;
      const { projectId } = input;

      try {
        // First verify the user has access to this project
        const projectAccess = await prisma.teamMembership.findFirst({
          where: {
            projectId,
            userId: session.user.id
          }
        });

        if (!projectAccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have access to this project"
          });
        }

        // Get all team members for this project
        const teamMembers = await prisma.teamMembership.findMany({
          where: { projectId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        });

        // Return just the user data
        return teamMembers.map(member => member.user);
      } catch (error) {
        console.error("Error fetching project members:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch project members"
        });
      }
    }),
});