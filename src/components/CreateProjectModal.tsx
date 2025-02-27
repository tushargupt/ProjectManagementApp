// src/components/CreateProjectModal.tsx
import React, { useState } from 'react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }) => Promise<void>;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  onClose, 
  onCreateProject 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProject({
        name,
        description: description || undefined,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined
      });
    } catch (error) {
      console.error('Project creation error', error);
      alert('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block mb-2">Project Name</label>
            <input 
              id="projectName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required 
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-2">Description (Optional)</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block mb-2">Start Date</label>
              <input 
                id="startDate"
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block mb-2">End Date (Optional)</label>
              <input 
                id="endDate"
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;