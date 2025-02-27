// src/components/TaskManagement.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { trpc } from '../utils/trpc';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define types
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';

interface Task {
  id?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  assignedToId?: string;
  dueDate?: Date;
  estimatedHours?: number;
}

interface CreateEditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  projectId?: string;
}

const TaskManagement: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);

  // Fetch projects user is involved in
  const { data: projects } = trpc.project.getUserProjects.useQuery();
  
  // Fetch tasks based on selected project
  const { data: projectTasks } = trpc.task.getUserTasks.useQuery({
    projectId: selectedProject || undefined
  });

  // Create task mutation
  const createTaskMutation = trpc.task.createTask.useMutation({
    onSuccess: (newTask) => {
      setTasks(prev => [...prev, newTask]);
      setIsCreateModalOpen(false);
    }
  });

  // CreateEditTaskModal Component
  const CreateEditTaskModal: React.FC<CreateEditTaskModalProps> = ({
    isOpen, 
    onClose, 
    task, 
    projectId
  }) => {
    const [formData, setFormData] = useState<Partial<Task>>({
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      dueDate: task?.dueDate,
      estimatedHours: task?.estimatedHours,
      assignedToId: task?.assignedToId || session?.user?.id
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (task && task.id) {
        // Update existing task logic
      } else if (projectId) {
        // Create new task
        createTaskMutation.mutate({
          projectId,
          ...formData as any
        });
      }
      
      onClose();
    };

    // Only render if modal is open
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg w-full max-w-md">
          <h2 className="text-2xl mb-4">
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({
                  ...prev, 
                  title: e.target.value
                }))}
                className="w-full border rounded p-2"
                required
              />
            </div>
            {/* Add other form fields similar to the previous implementation */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                {task ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Task Management</h1>
      
      {/* Project and Create Task Controls */}
      <div className="flex justify-between items-center mb-6">
        <select
          value={selectedProject || ''}
          onChange={(e) => setSelectedProject(e.target.value || null)}
          className="border rounded p-2"
        >
          <option value="">All Projects</option>
          {projects?.map(project => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={() => {
            setSelectedTask(undefined);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create Task
        </button>
      </div>

      {/* Create/Edit Task Modal */}
      <CreateEditTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedTask(undefined);
        }}
        task={selectedTask}
        projectId={selectedProject || undefined}
      />
    </div>
  );
};

export default TaskManagement;

export const calculateTaskAnalytics = (tasks: Task[]) => {
  const totalTasks = tasks.length;
  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const tasksByPriority = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<TaskPriority, number>);

  const completedTasks = tasks.filter(task => task.status === 'DONE').length;
  const completionRate = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  const overdueTasks = tasks.filter(task => 
    task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
  ).length;

  return {
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    completedTasks,
    completionRate,
    overdueTasks
  };
};