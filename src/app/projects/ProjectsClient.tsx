"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/utils/trpc";
import ProjectList from "~/components/ProjectList";
import CreateProjectModal from "~/components/CreateProjectModal";
import Link from "next/link";
import { useDebugTRPC } from "~/hooks/useDebugTRPC";

interface ProjectsClientProps {
  session: any;
}

export default function ProjectsClient({ session }: ProjectsClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  console.log(
    "ProjectsClient rendering, session:",
    session ? "Present" : "Missing",
  );

  // Fetch projects
  const {
    data: projects,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.project.getUserProjects.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
    onError: (err) => {
      console.error("Error fetching projects:", err);
    },
  });

  // Use debug hook
  useDebugTRPC("getUserProjects", projects, isLoading, isError, error);

  // Create project mutation
  const createProjectMutation = trpc.project.createProject.useMutation({
    onSuccess: (data) => {
      console.log("Project created successfully:", data);
      setShowCreateModal(false);
      refetch();
    },
    onError: (err) => {
      console.error("Error creating project:", err);
      setCreateError(`Failed to create project: ${err.message}`);
    },
  });

  // Use debug hook for mutation
  useDebugTRPC(
    "createProject",
    createProjectMutation.data,
    createProjectMutation.isLoading,
    createProjectMutation.isError,
    createProjectMutation.error,
  );

  const handleCreateProject = async (projectData: {
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
  }) => {
    setCreateError(null);
    console.log("Creating project with data:", projectData);

    try {
      // Ensure startDate is provided
      const dataToSend = {
        name: projectData.name,
        description: projectData.description,
        startDate: projectData.startDate || new Date(),
        endDate: projectData.endDate,
      };

      console.log("Sending data to mutation:", dataToSend);
      await createProjectMutation.mutateAsync(dataToSend);
    } catch (error) {
      console.error("Error in handleCreateProject:", error);
      // Error handling is done in onError callback
    }
  };

  const handleProjectSelect = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  // Log when component mounts
  useEffect(() => {
    console.log("ProjectsClient mounted");
    return () => console.log("ProjectsClient unmounted");
  }, []);

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">
          Error loading projects: {error?.message || "Unknown error"}
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <button
          onClick={() => {
            console.log("Create button clicked");
            setShowCreateModal(true);
          }}
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Create New Project
        </button>
      </div>

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => {
            console.log("Modal closed");
            setShowCreateModal(false);
            setCreateError(null);
          }}
          onCreateProject={handleCreateProject}
          error={createError}
        />
      )}

      <div className="mb-8">
        <Link
          href="/dashboard"
          className="flex items-center text-blue-500 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-blue-500"></div>
        </div>
      ) : (
        <ProjectList
          projects={projects || []}
          onProjectSelect={handleProjectSelect}
        />
      )}
    </div>
  );
}
