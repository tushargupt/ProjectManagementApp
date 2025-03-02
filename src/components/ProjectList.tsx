import React from 'react';
import { Project } from '@prisma/client';

interface ProjectListProps {
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onProjectSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div 
          key={project.id} 
          className="bg-white shadow rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onProjectSelect(project.id)}
        >
          <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
          <p className="text-gray-600 mb-4">{project.description || 'No description'}</p>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
            {project.endDate && (
              <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      ))}
      {projects.length === 0 && (
        <div className="col-span-full text-center text-gray-500 py-8">
          No projects found. Create your first project!
        </div>
      )}
    </div>
  );
};

export default ProjectList;