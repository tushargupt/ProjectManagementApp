// src/server/api/routers/post.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: protectedProcedure
    .input(z.object({ 
      name: z.string().min(1, "Name is required"),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.post.create({
          data: {
            name: input.name,
            content: input.content,
            createdBy: { connect: { id: ctx.session.user.id } },
          },
        });
      } catch (error) {
        console.error("Error creating post:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create post",
        });
      }
    }),

  getLatest: protectedProcedure.query(async ({ ctx }) => {
    try {
      const post = await ctx.prisma.post.findFirst({
        orderBy: { createdAt: "desc" },
        where: { createdBy: { id: ctx.session.user.id } },
      });

      return post ?? null;
    } catch (error) {
      console.error("Error fetching latest post:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch the latest post",
      });
    }
  }),

  getSecretMessage: protectedProcedure.query(() => {
    return "you can now see this secret message!";
  }),

  getAll: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;
      
      try {
        const posts = await ctx.prisma.post.findMany({
          take: limit + 1,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: "desc" },
          where: { createdBy: { id: ctx.session.user.id } },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (posts.length > limit) {
          const nextItem = posts.pop();
          nextCursor = nextItem?.id;
        }

        return {
          posts,
          nextCursor,
        };
      } catch (error) {
        console.error("Error fetching all posts:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch posts",
        });
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.prisma.post.findUnique({
          where: { id: input.id },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        if (!post) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        // Check if the user is the creator of the post
        if (post.createdBy.id !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to view this post",
          });
        }

        return post;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Error fetching post by ID:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch post",
        });
      }
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1, "Name is required").optional(),
      content: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      try {
        // First check if post exists and user has permission to update it
        const existingPost = await ctx.prisma.post.findUnique({
          where: { id },
          select: {
            createdById: true,
          },
        });

        if (!existingPost) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        if (existingPost.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to update this post",
          });
        }

        // Update the post
        return await ctx.prisma.post.update({
          where: { id },
          data,
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Error updating post:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update post",
        });
      }
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // First check if post exists and user has permission to delete it
        const existingPost = await ctx.prisma.post.findUnique({
          where: { id: input.id },
          select: {
            createdById: true,
          },
        });

        if (!existingPost) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Post not found",
          });
        }

        if (existingPost.createdById !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to delete this post",
          });
        }

        // Delete the post
        await ctx.prisma.post.delete({
          where: { id: input.id },
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        console.error("Error deleting post:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete post",
        });
      }
    }),
});