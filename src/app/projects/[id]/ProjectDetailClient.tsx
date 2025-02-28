// src/app/projects/[id]/ProjectDetailClient.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "~/utils/trpc";
import Link from "next/link";
import CreateTaskModal from "~/components/CreateTaskModal";
import AddTeamMemberModal from "~/components/AddTeamMemberModal";

interface ProjectDetailClientProps {
  session: any;
  projectId: string;
}

export default function ProjectDetailClient({
  session,
  projectId,
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks");
  const [showAddTeamMemberModal, setShowAddTeamMemberModal] = useState(false);

  const {
    data: projectTasks,
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = trpc.task.getProjectTasks.useQuery({ projectId });

  const {
    data: project,
    isLoading: projectLoading,
    refetch: refetchProject,
  } = trpc.project.getProjectById.useQuery({ projectId });

  const createTaskMutation = trpc.task.createTask.useMutation({
    onSuccess: () => {
      setShowCreateTaskModal(false);
      refetchTasks();
    },
  });

  const handleCreateTask = async (taskData: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedToIds?: string[];
    dueDate?: Date;
  }) => {
    await createTaskMutation.mutateAsync({
      ...taskData,
      projectId,
    });
  };

  if (projectLoading || tasksLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-4 border-solid border-blue-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6 rounded-md bg-red-100 p-4 text-red-700">
          Project not found or you don't have access.
        </div>
        <Link href="/projects" className="text-blue-500 hover:underline">
          ← Back to Projects
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PLANNING":
        return "bg-blue-100 text-blue-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "DONE":
        return "bg-green-100 text-green-800";
      case "BLOCKED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/projects" className="text-blue-500 hover:underline">
          ← Back to Projects
        </Link>
      </div>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">{project.name}</h1>
            <p className="mb-4 text-gray-600">
              {project.description || "No description provided."}
            </p>

            <div className="mb-4 flex gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Start Date:</span>{" "}
                {formatDate(project.startDate)}
              </div>
              {project.endDate && (
                <div>
                  <span className="font-medium">End Date:</span>{" "}
                  {formatDate(project.endDate)}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <span
                className={`rounded-full px-3 py-1 text-sm ${getStatusColor(project.status)}`}
              >
                {project.status}
              </span>
              {project.priority && (
                <span className="ml-3 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800">
                  {project.priority} Priority
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowCreateTaskModal(true)}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b">
        <nav className="flex gap-6">
          <button
            className={`border-b-2 px-1 py-2 ${
              activeTab === "tasks"
                ? "border-blue-500 font-medium text-blue-500"
                : "border-transparent hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks
          </button>
          <button
            className={`border-b-2 px-1 py-2 ${
              activeTab === "team"
                ? "border-blue-500 font-medium text-blue-500"
                : "border-transparent hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("team")}
          >
            Team
          </button>
          <button
            className={`border-b-2 px-1 py-2 ${
              activeTab === "files"
                ? "border-blue-500 font-medium text-blue-500"
                : "border-transparent hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("files")}
          >
            Files
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "tasks" && (
          <div>
            <h2 className="mb-4 text-xl font-bold">Project Tasks</h2>
            {projectTasks && projectTasks.length > 0 ? (
              <div className="overflow-hidden rounded-lg bg-white shadow">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {projectTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {task.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {task.description?.slice(0, 50)}
                            {task.description?.length > 50 ? "..." : ""}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`rounded px-2 py-1 text-xs ${getTaskStatusColor(task.status)}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {task.assignedTo
                              ? task.assignedTo.name
                              : "Unassigned"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {task.dueDate
                            ? formatDate(task.dueDate)
                            : "No deadline"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="mr-3 text-blue-600 hover:text-blue-900"
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
              <div className="rounded-lg bg-white p-6 text-center shadow">
                <p className="mb-4 text-gray-500">
                  No tasks have been created for this project yet.
                </p>
                <button
                  onClick={() => setShowCreateTaskModal(true)}
                  className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  Create First Task
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "team" && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Project Team</h2>
              <button
                onClick={() => setShowAddTeamMemberModal(true)}
                className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Add Team Member
              </button>
            </div>
            {project.teamMembers && project.teamMembers.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center rounded-lg bg-white p-4 shadow"
                  >
                    <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                      {member.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="font-medium">
                        {member.user?.name || "Unknown User"}
                      </div>
                      <div className="text-sm text-gray-500">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 text-center shadow">
                <p className="text-gray-500">
                  No team members added to this project yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "files" && (
          <div>
            <h2 className="mb-4 text-xl font-bold">Project Files</h2>
            {project.documents && project.documents.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-lg bg-white p-4 shadow"
                  >
                    <div className="mb-2 text-gray-600">📄 {document.name}</div>
                    <div className="text-sm text-gray-500">
                      Uploaded on {formatDate(document.uploadedAt)}
                    </div>
                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-500 hover:underline"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg bg-white p-6 text-center shadow">
                <p className="text-gray-500">
                  No files have been uploaded to this project yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateTaskModal && (
        <CreateTaskModal
        onClose={() => setShowCreateTaskModal(false)}
        onCreateTask={handleCreateTask}
        projectId={projectId}
        projectTeamMembers={project?.teamMembers}
      />
      )}

      {showAddTeamMemberModal && (
        <AddTeamMemberModal
          projectId={projectId}
          onClose={() => setShowAddTeamMemberModal(false)}
          onMemberAdded={() => {
            refetchProject();
            setShowAddTeamMemberModal(false);
          }}
        />
      )}
    </div>
  );
}
