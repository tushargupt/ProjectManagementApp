import React, { useState, useEffect } from 'react';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
  }) => Promise<void>;
  error?: string | null;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ 
  onClose, 
  onCreateProject,
  error: externalError
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Reset internal error when external error changes
  useEffect(() => {
    if (externalError) {
      setInternalError(externalError);
      setIsSubmitting(false);
    }
  }, [externalError]);

  // Log component lifecycle
  useEffect(() => {
    console.log("CreateProjectModal mounted");
    return () => console.log("CreateProjectModal unmounted");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setInternalError(null);
    
    if (!name.trim()) {
      setInternalError('Project name is required');
      return;
    }

    console.log("Form submitted with data:", {
      name,
      description,
      startDate,
      endDate
    });

    setIsSubmitting(true);
    try {
      console.log("Calling onCreateProject");
      await onCreateProject({
        name,
        description: description || undefined,
        startDate,
        endDate
      });
      console.log("onCreateProject completed");
    } catch (error) {
      console.error('Project creation error', error);
      setInternalError('Failed to create project. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Input change handlers that convert string to Date
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    setStartDate(selectedDate);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value ? new Date(e.target.value) : undefined;
    setEndDate(selectedDate);
  };

  // Convert Date to input string format
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create New Project</h2>
        
        {(internalError || externalError) && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {internalError || externalError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="projectName" className="block mb-2">Project Name <span className="text-red-500">*</span></label>
            <input 
              id="projectName"
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full border ${formSubmitted && !name.trim() ? 'border-red-500' : 'border-gray-300'} rounded px-3 py-2`}
              required 
            />
            {formSubmitted && !name.trim() && (
              <p className="text-red-500 text-sm mt-1">Name is required</p>
            )}
          </div>
          <div>
            <label htmlFor="description" className="block mb-2">Description (Optional)</label>
            <textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block mb-2">Start Date</label>
              <input 
                id="startDate"
                type="date" 
                value={formatDateForInput(startDate)}
                onChange={handleStartDateChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block mb-2">End Date (Optional)</label>
              <input 
                id="endDate"
                type="date" 
                value={endDate ? formatDateForInput(endDate) : ''}
                onChange={handleEndDateChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              disabled={isSubmitting}
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
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 border border-gray-300 rounded bg-gray-50 text-xs">
              <p>Debug Info:</p>
              <p>isSubmitting: {isSubmitting ? 'true' : 'false'}</p>
              <p>formSubmitted: {formSubmitted ? 'true' : 'false'}</p>
              <p>name: {name}</p>
              <p>startDate: {startDate.toISOString()}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;