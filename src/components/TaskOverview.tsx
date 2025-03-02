import React from 'react';
import { Task } from '@prisma/client';

interface TaskOverviewProps {
  tasks: Task[];
  onTaskSelect: (taskId: string) => void;
}

const TaskOverview: React.FC<TaskOverviewProps> = ({ tasks, onTaskSelect }) => {
  // Task status color mapping
  const statusColorMap = {
    BACKLOG: 'bg-gray-200',
    TODO: 'bg-blue-200',
    IN_PROGRESS: 'bg-yellow-200',
    REVIEW: 'bg-purple-200',
    DONE: 'bg-green-200'
  };

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div 
          key={task.id} 
          className="bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow flex items-center"
          onClick={() => onTaskSelect(task.id)}
        >
          <div 
            className={`w-4 h-4 rounded-full mr-4 ${statusColorMap[task.status]}`}
          />
          <div className="flex-grow">
            <h4 className="font-semibold">{task.title}</h4>
            <p className="text-sm text-gray-600">
              {task.dueDate 
                ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` 
                : 'No due date'}
            </p>
          </div>
          <span className={`
            px-2 py-1 rounded text-xs font-medium
            ${task.priority === 'HIGH' ? 'bg-red-200 text-red-800' : 
              task.priority === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' : 
              'bg-green-200 text-green-800'}
          `}>
            {task.priority}
          </span>
        </div>
      ))}
      {tasks.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No tasks found. Create your first task!
        </div>
      )}
    </div>
  );
};

export default TaskOverview;