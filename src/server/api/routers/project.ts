// src/server/api/routers/project.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const projectRouter = createTRPCRouter({
  getUserProjects: protectedProcedure
    .query(async ({ ctx }) => {
      const { session, prisma } = ctx;
      
      try {
        const projects = await prisma.project.findMany({
          where: {
            ownerId: session.user.id,
          },
          include: {
            tasks: true,
            teamMembers: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        });
        
        return projects;
      } catch (error) {
        console.error("Error fetching user projects:", error);
        throw new Error("Failed to fetch projects");
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
        
        return project;
      } catch (error) {
        console.error("Error fetching project:", error);
        throw new Error("Failed to fetch project details");
      }
    }),

  createProject: protectedProcedure
    .input(z.object({
      name: z.string().min(1, "Name is required"),
      description: z.string().optional(),
      endDate: z.date().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { session, prisma } = ctx;
      
      try {
        const newProject = await prisma.project.create({
          data: {
            name: input.name,
            description: input.description,
            endDate: input.endDate,
            priority: input.priority || 'MEDIUM',
            status: 'PLANNING',
            owner: {
              connect: {
                id: session.user.id,
              },
            },
            teamMembers: {
              create: {
                user: {
                  connect: {
                    id: session.user.id,
                  },
                },
                role: 'OWNER',
              },
            },
          },
        });
        
        return newProject;
      } catch (error) {
        console.error("Error creating project:", error);
        throw new Error("Failed to create project");
      }
    }),

  updateProject: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required").optional(),
      description: z.string().optional(),
      endDate: z.date().optional(),
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
        throw new Error("Project not found");
      }
      
      // Check if user is owner or admin
      const userMembership = project.teamMembers.find(
        member => member.userId === session.user.id
      );
      
      if (!userMembership || (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN')) {
        throw new Error("You don't have permission to update this project");
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
        throw new Error("Failed to update project");
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
        throw new Error("Project not found");
      }
      
      if (project.ownerId !== session.user.id) {
        throw new Error("Only the project owner can delete a project");
      }
      
      // Delete the project
      try {
        await prisma.project.delete({
          where: { id: projectId },
        });
        
        return { success: true };
      } catch (error) {
        console.error("Error deleting project:", error);
        throw new Error("Failed to delete project");
      }
    }),
});