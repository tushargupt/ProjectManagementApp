"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { trpc } from "~/utils/trpc";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Import components
import UserProfile from "~/components/UserProfile";
import TaskManagementComponent from "~/components/TaskManagement";
import CreateProjectModal from "~/components/CreateProjectModal";

// Define types for better type safety
interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: Date;
}

interface NotificationType {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  type: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  department?: string;
  skills?: string[];
}

interface TaskAnalytics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  completionRate: number;
}

interface DashboardClientProps {
  initialData: {
    session: any;
    // Add other initial data types
  };
}

// Dashboard navigation items
const DASHBOARD_SECTIONS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "tasks", label: "Task Management", icon: "✓" },
  { id: "projects", label: "Projects", icon: "📁" },
  { id: "profile", label: "Profile", icon: "👤" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
];

// Task analytics calculation function
function calculateTaskAnalytics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const inProgress = tasks.filter(
    (task) => task.status === "IN_PROGRESS" || task.status === "REVIEW",
  ).length;
  const todo = tasks.filter(
    (task) => task.status === "TODO" || task.status === "BACKLOG",
  ).length;

  // Calculate overdue tasks
  const today = new Date();
  const overdue = tasks.filter((task) => {
    if (!task.dueDate) return false;
    if (task.status === "DONE") return false;
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
    completionRate,
  };
}

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const router = useRouter();
  // Use the session from both props and client-side
  const { data: sessionData } = useSession();
  // Use the session from either source
  const session = sessionData || initialData.session;

  const [activeSection, setActiveSection] = useState("overview");
  const dashboardRef = useRef(null);

  // Set up ref to allow child components to access setActiveSection
  useEffect(() => {
    if (dashboardRef.current) {
      dashboardRef.current.__setActiveSection = setActiveSection;
    }
  }, [dashboardRef, setActiveSection]);

  // Fetch user data
  const { data: userData, isLoading: userLoading } =
    trpc.user.getProfile.useQuery(undefined, { enabled: !!session });

  // Fetch user tasks
  const { data: tasks, isLoading: tasksLoading } =
    trpc.task.getUserTasks.useQuery(undefined, { enabled: !!session });

  // Fetch user projects
  const { data: projects, isLoading: projectsLoading } =
    trpc.project.getUserProjects.useQuery(undefined, { enabled: !!session });

  // Fetch user notifications
  const { data: notificationsData, isLoading: notificationsLoading } =
    trpc.user.getNotifications.useQuery({ limit: 5 }, { enabled: !!session });

  const notifications = notificationsData?.notifications || [];

  // Calculate task analytics
  const taskAnalytics = tasks
    ? calculateTaskAnalytics(tasks)
    : {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        overdue: 0,
        completionRate: 0,
      };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  // Loading state while data is being fetched
  if (userLoading || tasksLoading || notificationsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 animate-spin rounded-full border-t-4 border-solid border-blue-500"></div>
          <p className="mt-4 text-lg text-gray-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-4 text-2xl font-bold">Session Expired</h1>
          <p className="mb-6">
            Your session has expired or you're not logged in.
          </p>
          <Link
            href="/auth/signin"
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Render different dashboard sections
  const renderDashboardSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <DashboardOverview
            userData={userData}
            taskAnalytics={taskAnalytics}
            notifications={notifications}
            projects={projects || []}
            setActiveSection={setActiveSection}
          />
        );
      case "tasks":
        return <TaskManagementComponent tasks={tasks || []} />;
      case "projects":
        return <ProjectsSection projects={projects || []} />;
      case "profile":
        return <UserProfile userData={userData} />;
      case "notifications":
        return <NotificationsSection notifications={notifications} />;
      default:
        return (
          <DashboardOverview
            userData={userData}
            taskAnalytics={taskAnalytics}
            notifications={notifications}
            projects={projects || []}
            setActiveSection={setActiveSection}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dashboard-wrapper" ref={dashboardRef}>
      {/* Sidebar Navigation */}
      <div className="flex w-64 flex-col bg-white shadow-md">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold">Project Management</h1>
          <p className="mt-2 text-gray-600">Welcome, {session.user?.name}</p>
        </div>

        <nav className="flex-grow p-4">
          {DASHBOARD_SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`mb-2 flex w-full items-center rounded p-3 text-left ${
                activeSection === section.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              } `}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t p-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center rounded p-3 text-left text-red-500 hover:bg-gray-100"
          >
            <span className="mr-2">🚪</span>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">{renderDashboardSection()}</div>
      </div>
    </div>
  );
}

// Dashboard sections components
function DashboardOverview({
  userData,
  taskAnalytics,
  notifications,
  projects,
  setActiveSection
}) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Dashboard Overview</h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={taskAnalytics.total}
          color="bg-blue-500"
        />
        <StatCard
          title="In Progress"
          value={taskAnalytics.inProgress}
          color="bg-yellow-500"
        />
        <StatCard
          title="Completed"
          value={taskAnalytics.completed}
          color="bg-green-500"
        />
        <StatCard
          title="Overdue"
          value={taskAnalytics.overdue}
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Tasks */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-bold">Your Tasks</h3>
          <div className="mb-4">
            <div className="h-2.5 w-full rounded-full bg-gray-200">
              <div
                className="h-2.5 rounded-full bg-blue-600"
                style={{ width: `${taskAnalytics.completionRate}%` }}
              ></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {taskAnalytics.completionRate}% Complete
            </p>
          </div>

          <button
            onClick={() => setActiveSection("tasks")}
            className="mt-2 inline-block text-sm text-blue-500 hover:underline"
          >
            View all tasks →
          </button>
        </div>

        {/* Recent Notifications */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-bold">Recent Notifications</h3>
          {notifications.length > 0 ? (
            <ul className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <li key={notification.id} className="border-b pb-2">
                  <p className="text-sm">{notification.message}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No new notifications</p>
          )}

          <button
            onClick={() => setActiveSection("notifications")}
            className="mt-4 inline-block text-sm text-blue-500 hover:underline"
          >
            View all notifications →
          </button>
        </div>
      </div>

      {/* Projects Section */}
      <div className="mt-8 rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-bold">Your Projects</h3>
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                className="rounded border p-4 transition-shadow hover:shadow-md"
              >
                <h4 className="font-medium">{project.name}</h4>
                <p className="mt-1 truncate text-sm text-gray-600">
                  {project.description || "No description provided"}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`rounded px-2 py-1 text-xs ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No projects found</p>
        )}

        <button
          onClick={() => setActiveSection("projects")}
          className="mt-4 inline-block text-sm text-blue-500 hover:underline"
        >
          View all projects →
        </button>
      </div>
    </div>
  );
}

function ProjectsSection({ projects }) {
    const router = useRouter();
    const [showCreateModal, setShowCreateModal] = useState(false);
  
    // TRPC mutation for creating projects
    const createProjectMutation = trpc.project.createProject.useMutation({
      onSuccess: () => {
        alert("Project created successfully!");
        // Refresh the page to see the new project
        router.refresh();
      },
      onError: (err) => {
        console.error("Error creating project:", err);
        alert("Failed to create project: " + (err.message || "Unknown error"));
      },
    });
  
    // Handler for creating a project
    const handleCreateProject = async (projectData) => {
      try {
        // Ensure startDate is a Date object
        const data = {
          name: projectData.name,
          description: projectData.description,
          startDate: new Date(projectData.startDate || new Date()),
          endDate: projectData.endDate ? new Date(projectData.endDate) : undefined
        };
        
        await createProjectMutation.mutateAsync(data);
        setShowCreateModal(false);
      } catch (error) {
        console.error('Error creating project:', error);
      }
    };
  
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            New Project
          </button>
        </div>
  
        {projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg bg-white shadow transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <h3 className="mb-2 text-lg font-bold">{project.name}</h3>
                  <p className="mb-4 h-12 overflow-hidden text-gray-600">
                    {project.description || "No description provided"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-2 py-1 text-xs ${getStatusColor(project.status)}`}
                    >
                      {project.status}
                    </span>
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-500 hover:underline"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-b-lg border-t bg-gray-50 px-6 py-3">
                  <div className="text-sm text-gray-500">
                    {project.tasks?.length || 0} Tasks
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(project.startDate)} -{" "}
                    {project.endDate ? formatDate(project.endDate) : "Ongoing"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <h3 className="mb-2 text-lg font-medium">No projects yet</h3>
            <p className="mb-6 text-gray-600">
              Start by creating your first project
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Create Project
            </button>
          </div>
        )}
  
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreateProject={handleCreateProject}
          />
        )}
      </div>
    );
  }

function NotificationsSection({ notifications }) {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Notifications</h2>

      {notifications.length > 0 ? (
        <div className="rounded-lg bg-white shadow">
          <ul className="divide-y">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`p-4 hover:bg-gray-50 ${!notification.isRead ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start">
                  <div
                    className={`mr-3 mt-1 ${getNotificationIconColor(notification.type)}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`${!notification.isRead ? "font-medium" : ""}`}
                    >
                      {notification.message}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <span className="inline-flex items-center rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      New
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <h3 className="mb-2 text-lg font-medium">No notifications</h3>
          <p className="text-gray-600">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}

// Helper components
function StatCard({ title, value, color }) {
  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className={`inline-block rounded-full p-3 ${color} mb-4 text-white`}>
        {/* Icon would go here */}
      </div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

// Helper functions
function getStatusColor(status) {
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
}

function getNotificationIcon(type) {
  switch (type) {
    case "TASK_ASSIGNED":
      return "✓";
    case "TASK_UPDATED":
      return "🔄";
    case "PROJECT_INVITE":
      return "📨";
    case "COMMENT_MENTION":
      return "💬";
    case "DEADLINE_APPROACHING":
      return "⏰";
    default:
      return "🔔";
  }
}

function getNotificationIconColor(type) {
  switch (type) {
    case "TASK_ASSIGNED":
      return "text-blue-500";
    case "TASK_UPDATED":
      return "text-green-500";
    case "PROJECT_INVITE":
      return "text-purple-500";
    case "COMMENT_MENTION":
      return "text-yellow-500";
    case "DEADLINE_APPROACHING":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Helper functions for task management
function getTaskStatusColor(status) {
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
}

function getTaskPriorityColor(priority) {
  switch (priority) {
    case "LOW":
      return "bg-green-100 text-green-800";
    case "MEDIUM":
      return "bg-blue-100 text-blue-800";
    case "HIGH":
      return "bg-yellow-100 text-yellow-800";
    case "CRITICAL":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}