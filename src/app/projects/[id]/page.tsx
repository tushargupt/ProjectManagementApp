import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import ProjectDetailClient from "./ProjectDetailClient";
import { PageProps } from "next";

type ProjectParams = {
  id: string;
};

export default async function ProjectDetailPage({ 
  params 
}: PageProps<{ params: ProjectParams }>) { // Ensure correct typing
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <ProjectDetailClient session={session} projectId={params.id} />;
}
