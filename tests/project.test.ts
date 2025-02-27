// tests/project.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createCaller } from '../src/server/trpc/trpc';
import { prisma } from '../src/server/db';

describe('Project Management Functionality', () => {
  let testUser: any;
  let projectCaller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'test.user@example.com',
        name: 'Test User',
      }
    });

    // Create a caller with the test user's session
    projectCaller = createCaller({
      session: { 
        user: { 
          id: testUser.id, 
          email: testUser.email 
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      prisma
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.project.deleteMany({
      where: { ownerId: testUser.id }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
  });

  describe('Project Creation', () => {
    it('should create a new project successfully', async () => {
      const newProject = await projectCaller.project.createProject({
        name: 'Test Project',
        description: 'A project for testing',
        startDate: new Date(),
      });

      expect(newProject).toBeDefined();
      expect(newProject.name).toBe('Test Project');
      expect(newProject.description).toBe('A project for testing');
      expect(newProject.ownerId).toBe(testUser.id);
    });

    it('should fail to create a project with an empty name', async () => {
      await expect(
        projectCaller.project.createProject({
          name: '',
          startDate: new Date(),
        })
      ).rejects.toThrow();
    });
  });

  describe('Project Retrieval', () => {
    let createdProject: any;

    beforeAll(async () => {
      createdProject = await projectCaller.project.createProject({
        name: 'Retrieval Test Project',
        startDate: new Date(),
      });
    });

    it('should retrieve user projects', async () => {
      const projects = await projectCaller.project.getUserProjects();
      
      expect(projects).toBeDefined();
      expect(projects.length).toBeGreaterThan(0);
      
      const retrievedProject = projects.find(p => p.id === createdProject.id);
      expect(retrievedProject).toBeDefined();
      expect(retrievedProject?.name).toBe('Retrieval Test Project');
    });

    it('should retrieve specific project by ID', async () => {
      const project = await projectCaller.project.getProjectById({
        projectId: createdProject.id
      });

      expect(project).toBeDefined();
      expect(project.id).toBe(createdProject.id);
      expect(project.name).toBe('Retrieval Test Project');
    });
  });

  describe('Project Update', () => {
    let projectToUpdate: any;

    beforeAll(async () => {
      projectToUpdate = await projectCaller.project.createProject({
        name: 'Update Test Project',
        startDate: new Date(),
      });
    });

    it('should update project details', async () => {
      const updatedProject = await projectCaller.project.updateProject({
        projectId: projectToUpdate.id,
        name: 'Updated Project Name',
        description: 'Updated description'
      });

      expect(updatedProject.name).toBe('Updated Project Name');
      expect(updatedProject.description).toBe('Updated description');
    });
  });
});