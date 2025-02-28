'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '~/utils/trpc';
import Link from 'next/link';

interface TaskDetailClientProps {
  session: any;
  taskId: string;
}

export default function TaskDetailClient({ session, taskId }: TaskDetailClientProps) {
  const router = useRouter();
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assignedToIds: [], // Changed from assignedToId to assignedToIds array
    dueDate: ''
  });

  const { data: task, isLoading, refetch } = trpc.task.getTaskById.useQuery({
    taskId,
  });

  // Query to fetch ALL project members (not just available ones)
  const { data: projectUsers } = trpc.project.getProjectMembers.useQuery(
    { projectId: task?.projectId || '' },
    { enabled: !!task?.projectId && isEditing }
  );

  const updateTaskMutation = trpc.task.updateTask.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      refetch();
    },
  });

  const addCommentMutation = trpc.task.addComment.useMutation({
    onSuccess: () => {
      setCommentContent('');
      setIsSubmittingComment(false);
      refetch();
    },
  });

  const handleStatusChange = async (newStatus) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!commentContent.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await addCommentMutation.mutateAsync({
        taskId,
        content: commentContent
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      setIsSubmittingComment(false);
    }
  };

  // Handle assignee selection changes
  const handleAssigneeChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      (option) => option.value
    );
    setEditFormData({...editFormData, assignedToIds: selectedOptions});
  };

  const startEditing = () => {
    if (!task) return;
    
    setEditFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedToIds: task.assignedTo ? task.assignedTo.map(user => user.id) : [], // Map array of users to array of ids
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    
    setIsEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        title: editFormData.title,
        description: editFormData.description || undefined,
        status: editFormData.status,
        priority: editFormData.priority,
        assignedToIds: editFormData.assignedToIds, // Use the array of IDs
        dueDate: editFormData.dueDate ? new Date(editFormData.dueDate) : undefined
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          Task not found or you don't have access.
        </div>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

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
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link 
          href={`/projects/${task.projectId}`} 
          className="text-blue-500 hover:underline"
        >
          ← Back to Project
        </Link>
      </div>

      {isEditing ? (
        // Edit Form
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Edit Task</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  id="status"
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
                <select
                  id="priority"
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
              <select
                id="assignedTo"
                multiple
                value={editFormData.assignedToIds}
                onChange={handleAssigneeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 min-h-[100px]"
              >
                {projectUsers?.map(user => (
                  <option 
                    key={user.id} 
                    value={user.id}
                  >
                    {user.name || user.email}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
            </div>
            
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
              <input
                type="date"
                id="dueDate"
                value={editFormData.dueDate}
                onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={updateTaskMutation.isLoading}
              >
                {updateTaskMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // Task Details View
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold mb-2">{task.title}</h1>
              {task.project && (
                <div className="text-gray-600 mb-4">
                  Project: <Link href={`/projects/${task.projectId}`} className="text-blue-500 hover:underline">{task.project.name}</Link>
                </div>
              )}
            </div>
            <button
              onClick={startEditing}
              className="text-blue-500 hover:bg-blue-50 px-3 py-1 rounded"
            >
              Edit
            </button>
          </div>
          
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {task.description || 'No description provided.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <div className="mt-1">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-1 rounded text-sm ${getTaskStatusColor(task.status)} border border-transparent focus:border-gray-300`}
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Priority</h4>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${getTaskPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Assigned To</h4>
              <div className="mt-1">
                {task.assignedTo && task.assignedTo.length > 0 ? (
                  <div className="flex flex-col space-y-2">
                    {task.assignedTo.map(user => (
                      <div key={user.id} className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 mr-2">
                          {user.name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <span>{user.name || user.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Unassigned</span>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Due Date</h4>
              <div className="mt-1">
                {task.dueDate ? (
                  <span className={`text-sm ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                    {formatDate(task.dueDate)}
                  </span>
                ) : (
                  <span className="text-gray-500">No deadline</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Comments</h2>
        
        <div className="mb-6">
          <form onSubmit={handleAddComment}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="Add a comment..."
              className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmittingComment || !commentContent.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {isSubmittingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
        
        {task.comments && task.comments.length > 0 ? (
          <div className="space-y-4">
            {task.comments.map((comment) => (
              <div key={comment.id} className="border-b pb-4">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 mr-3">
                    {comment.author?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{comment.author?.name || 'Unknown User'}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-gray-700">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            No comments yet. Be the first to add one!
          </div>
        )}
      </div>
    </div>
  );
}