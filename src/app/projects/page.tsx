import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import ProjectsClient from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await getAuthSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  return <ProjectsClient session={session} />;
}