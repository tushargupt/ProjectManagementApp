// tests/task.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createCaller } from '../src/server/trpc/trpc';
import { prisma } from '../src/server/db';

describe('Task Management Functionality', () => {
  let testUser: any;
  let testProject: any;
  let taskCaller: ReturnType<typeof createCaller>;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'task.test.user@example.com',
        name: 'Task Test User',
    }
  });

  // Create a test project
  testProject = await prisma.project.create({
    data: {
      name: 'Test Task Project',
      owner: { connect: { id: testUser.id } },
      teamMembers: {
        create: {
          user: { connect: { id: testUser.id } },
          role: 'OWNER'
        }
      }
    }
  });

  // Create a caller with the test user's session
  taskCaller = createCaller({
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
  await prisma.task.deleteMany({
    where: { projectId: testProject.id }
  });
  await prisma.project.delete({
    where: { id: testProject.id }
  });
  await prisma.user.delete({
    where: { id: testUser.id }
  });
});

describe('Task Creation', () => {
  it('should create a new task successfully', async () => {
    const newTask = await taskCaller.task.createTask({
      projectId: testProject.id,
      title: 'Test Task',
      description: 'A task for testing',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      tags: ['testing', 'development']
    });

    expect(newTask).toBeDefined();
    expect(newTask.title).toBe('Test Task');
    expect(newTask.description).toBe('A task for testing');
    expect(newTask.status).toBe('TODO');
    expect(newTask.priority).toBe('MEDIUM');
    expect(newTask.tags).toHaveLength(2);
  });

  it('should fail to create a task with an empty title', async () => {
    await expect(
      taskCaller.task.createTask({
        projectId: testProject.id,
        title: '',
        status: 'BACKLOG'
      })
    ).rejects.toThrow();
  });

  it('should fail to create a task for a non-existent project', async () => {
    await expect(
      taskCaller.task.createTask({
        projectId: 'non-existent-project-id',
        title: 'Impossible Task'
      })
    ).rejects.toThrow();
  });
});

describe('Task Retrieval', () => {
  let createdTask: any;

  beforeAll(async () => {
    createdTask = await taskCaller.task.createTask({
      projectId: testProject.id,
      title: 'Retrieval Test Task',
      status: 'IN_PROGRESS'
    });
  });

  it('should retrieve user tasks', async () => {
    const tasks = await taskCaller.task.getUserTasks();
    
    expect(tasks).toBeDefined();
    expect(tasks.length).toBeGreaterThan(0);
    
    const retrievedTask = tasks.find(t => t.id === createdTask.id);
    expect(retrievedTask).toBeDefined();
    expect(retrievedTask?.title).toBe('Retrieval Test Task');
  });

  it('should retrieve specific task by ID', async () => {
    const task = await taskCaller.task.getTaskById({
      taskId: createdTask.id
    });

    expect(task).toBeDefined();
    expect(task.id).toBe(createdTask.id);
    expect(task.title).toBe('Retrieval Test Task');
  });

  it('should filter tasks by status', async () => {
    const inProgressTasks = await taskCaller.task.getUserTasks({
      status: 'IN_PROGRESS'
    });

    expect(inProgressTasks).toBeDefined();
    expect(inProgressTasks.some(t => t.status === 'IN_PROGRESS')).toBe(true);
  });
});

describe('Task Update', () => {
  let taskToUpdate: any;

  beforeAll(async () => {
    taskToUpdate = await taskCaller.task.createTask({
      projectId: testProject.id,
      title: 'Update Test Task',
      status: 'TODO'
    });
  });

  it('should update task details', async () => {
    const updatedTask = await taskCaller.task.updateTask({
      taskId: taskToUpdate.id,
      title: 'Updated Task Name',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      tags: ['updated', 'priority-change']
    });

    expect(updatedTask.title).toBe('Updated Task Name');
    expect(updatedTask.status).toBe('IN_PROGRESS');
    expect(updatedTask.priority).toBe('HIGH');
    expect(updatedTask.tags).toHaveLength(2);
  });

  it('should update task assignee', async () => {
    const updatedTask = await taskCaller.task.updateTask({
      taskId: taskToUpdate.id,
      assignedToId: testUser.id
    });

    expect(updatedTask.assignedToId).toBe(testUser.id);
  });

  it('should clear task assignee', async () => {
    const updatedTask = await taskCaller.task.updateTask({
      taskId: taskToUpdate.id,
      assignedToId: null
    });

    expect(updatedTask.assignedToId).toBeNull();
  });
});

describe('Task Deletion', () => {
  let taskToDelete: any;

  beforeAll(async () => {
    taskToDelete = await taskCaller.task.createTask({
      projectId: testProject.id,
      title: 'Task to be Deleted',
      status: 'BACKLOG'
    });
  });

  it('should delete a task', async () => {
    const deletedTask = await taskCaller.task.deleteTask({
      taskId: taskToDelete.id
    });

    expect(deletedTask.id).toBe(taskToDelete.id);

    // Verify task is actually deleted
    await expect(
      taskCaller.task.getTaskById({ taskId: taskToDelete.id })
    ).rejects.toThrow();
  });
});
});