'use client';

import React, { useState } from 'react';
import { trpc } from '~/utils/trpc';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedToIds?: string[];
    dueDate?: Date;
  }) => Promise<void>;
  projectId: string;
  projectTeamMembers?: Array<{
    id: string;
    user: {
      id: string;
      name?: string;
      email?: string;
    };
  }>;
}

export default function CreateTaskModal({
  onClose, 
  onCreateTask, 
  projectId,
  projectTeamMembers = []
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  
  // Fetch project members directly in the component
  const { data: fetchedProjectMembers, isLoading } = trpc.project.getProjectMembers.useQuery(
    { projectId },
    { enabled: !!projectId && projectTeamMembers.length === 0 }
  );
  
  // Combine passed members with fetched members, preferring fetched ones if available
  const members = fetchedProjectMembers || projectTeamMembers.map(member => member.user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateTask({
      title,
      description,
      status,
      priority,
      assignedToIds,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
  };

  const toggleAssignee = (userId: string) => {
    setAssignedToIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded p-2"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div>
              <label className="block mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-2">Assigned To</label>
            {isLoading ? (
              <div className="text-gray-500 py-2">Loading team members...</div>
            ) : (
              <>
                {members && members.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    <div className="grid grid-cols-1 gap-2">
                      {members.map((member) => (
                        <label key={member.id} className="flex items-center py-1 px-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={assignedToIds.includes(member.id)}
                            onChange={() => toggleAssignee(member.id)}
                            className="mr-2"
                          />
                          <span>{member.name || member.email}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No team members to assign</p>
                )}
              </>
            )}
          </div>

          <div>
            <label className="block mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>

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
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}