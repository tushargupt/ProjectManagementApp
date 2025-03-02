import { redirect } from "next/navigation";
import { getAuthSession } from "~/server/auth";
import DashboardClient from "./DashboardClient";

// Fetch server-side data
async function fetchServerSideData() {
  try {
    const session = await getAuthSession();
    
    console.log("Dashboard session check:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    });
    
    if (!session) {
      console.log("No session found, redirecting to signin");
      redirect('/auth/signin');
    }

    // You can add additional data fetching here if needed
    return {
      session,
      // Add other server-side fetched data
    };
  } catch (error) {
    console.error("Error fetching session:", error);
    redirect('/auth/signin?error=session-error');
  }
}

export default async function DashboardPage() {
  const serverData = await fetchServerSideData();

  // Add a check to ensure we have a valid session
  if (!serverData.session) {
    redirect('/auth/signin?error=invalid-session');
  }

  return <DashboardClient initialData={serverData} />;
}