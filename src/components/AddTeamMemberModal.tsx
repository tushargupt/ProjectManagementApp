// src/components/AddTeamMemberModal.tsx
'use client';

import React, { useState } from 'react';
import { trpc } from '~/utils/trpc';

interface AddTeamMemberModalProps {
  projectId: string;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddTeamMemberModal({ 
  projectId, 
  onClose, 
  onMemberAdded 
}: AddTeamMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState<string | null>(null);

  // Fetch all users (excluding those already in the project)
  const { data: availableUsers, isLoading: usersLoading } = trpc.user.getAvailableUsers.useQuery({
    projectId
  });

  const addTeamMemberMutation = trpc.project.addTeamMember.useMutation({
    onSuccess: () => {
      onMemberAdded();
      onClose();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    // Find the selected user's email
    const selectedUser = availableUsers?.find(user => user.id === selectedUserId);
    
    if (!selectedUser) {
      setError('Selected user not found');
      return;
    }

    addTeamMemberMutation.mutate({
      projectId,
      email: selectedUser.email,
      role
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Add Team Member</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user" className="block mb-2">Select User</label>
            {usersLoading ? (
              <div className="w-full border rounded px-3 py-2 text-gray-500">
                Loading users...
              </div>
            ) : (
              <select
                id="user"
                value={selectedUserId || ''}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">Select a user</option>
                {availableUsers?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block mb-2">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
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
              disabled={addTeamMemberMutation.isLoading || !selectedUserId}
            >
              {addTeamMemberMutation.isLoading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}