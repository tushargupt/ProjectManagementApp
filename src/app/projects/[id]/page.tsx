// src/app/projects/[id]/page.tsx
import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import ProjectDetailClient from "./ProjectDetailClient";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <ProjectDetailClient session={session} projectId={params.id} />;
}