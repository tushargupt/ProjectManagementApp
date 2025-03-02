import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '~/utils/trpc';
import CreateTaskModal from './CreateTaskModal';

interface TaskProps {
  tasks: any[];
}

export function calculateTaskAnalytics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(task => task.status === 'DONE').length;
  const inProgress = tasks.filter(task => task.status === 'IN_PROGRESS' || task.status === 'REVIEW').length;
  const todo = tasks.filter(task => task.status === 'TODO' || task.status === 'BACKLOG').length;
  
  // Calculate overdue tasks
  const today = new Date();
  const overdue = tasks.filter(task => {
    if (!task.dueDate) return false;
    if (task.status === 'DONE') return false;
    const dueDate = new Date(task.dueDate);
    return dueDate < today;
  }).length;
  
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    inProgress,
    todo,
    overdue,
    completionRate
  };
}

export default function TaskManagementComponent({ tasks }: TaskProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // Fetch user's projects for task creation
  const { data: projects } = trpc.project.getUserProjects.useQuery();
  const { refetch } = trpc.task.getUserTasks.useQuery();
  
  const createTaskMutation = trpc.task.createTask.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      refetch();
    },
  });

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedToIds?: string[]; // Changed from assignedToId to assignedToIds array
    dueDate?: Date;
  }) => {
    if (!selectedProjectId) {
      alert('Please select a project first');
      return;
    }
    
    await createTaskMutation.mutateAsync({
      ...taskData,
      projectId: selectedProjectId,
    });
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowCreateModal(true);
  };

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    switch (activeFilter) {
      case 'PENDING':
        return task.status === 'TODO' || task.status === 'BACKLOG';
      case 'IN_PROGRESS':
        return task.status === 'IN_PROGRESS';
      case 'REVIEW':
        return task.status === 'REVIEW';
      case 'DONE':
        return task.status === 'DONE';
      case 'OVERDUE':
        return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
      default:
        return true;
    }
  });

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'BLOCKED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Task analytics
  const analytics = calculateTaskAnalytics(tasks);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <div className="flex gap-2">
          <div className="relative">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              Add New Task
            </button>
          </div>
        </div>
      </div>

      {/* Task Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
              <span className="text-xl">📋</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Tasks</div>
              <div className="text-xl font-bold">{analytics.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-4">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Completed</div>
              <div className="text-xl font-bold">{analytics.completed}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-4">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">In Progress</div>
              <div className="text-xl font-bold">{analytics.inProgress}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 mr-4">
              <span className="text-xl">📝</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">To Do</div>
              <div className="text-xl font-bold">{analytics.todo}</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-4">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Overdue</div>
              <div className="text-xl font-bold">{analytics.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'ALL'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('PENDING')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'PENDING'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          To Do
        </button>
        <button
          onClick={() => setActiveFilter('IN_PROGRESS')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          In Progress
        </button>
        <button
          onClick={() => setActiveFilter('REVIEW')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'REVIEW'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Review
        </button>
        <button
          onClick={() => setActiveFilter('DONE')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'DONE'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveFilter('OVERDUE')}
          className={`px-4 py-2 rounded-md ${
            activeFilter === 'OVERDUE'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {task.description?.slice(0, 50)}{task.description?.length > 50 ? '...' : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getTaskStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${getTaskPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {task.project ? (
                      <Link
                        href={`/projects/${task.projectId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {task.project.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.dueDate ? (
                      <span className={`${
                        new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                          ? 'text-red-600 font-medium'
                          : ''
                      }`}>
                        {formatDate(task.dueDate)}
                      </span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-6">
            {activeFilter !== 'ALL'
              ? `No tasks matching the "${activeFilter}" filter.`
              : 'Start by creating your first task!'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
          >
            Create Task
          </button>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
            
            {/* Project Selection (first step) */}
            {!selectedProjectId && (
              <div>
                <p className="mb-4">Select a project for this task:</p>
                <div className="space-y-2 mb-6">
                  {projects?.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectSelect(project.id)}
                      className="w-full text-left p-3 border rounded hover:bg-gray-50"
                    >
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500 truncate">
                        {project.description || 'No description'}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Task Creation Form (second step) */}
            {selectedProjectId && (
              <CreateTaskModal
                onClose={() => {
                  setShowCreateModal(false);
                  setSelectedProjectId('');
                }}
                onCreateTask={handleCreateTask}
                projectId={selectedProjectId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}