import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import TaskDetailClient from "./TaskDetailClient";

interface TaskDetailPageProps {
  params: {
    id: string;
  };
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <TaskDetailClient session={session} taskId={params.id} />;
}