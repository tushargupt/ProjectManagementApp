import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import TaskDetailClient from "./TaskDetailClient";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";

export default async function TaskDetailPage({ 
  params 
}: { 
  params: Params 
}) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <TaskDetailClient session={session} taskId={params.id} />;
}