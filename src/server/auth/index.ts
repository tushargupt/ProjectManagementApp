// src/server/auth/index.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "~/app/api/auth/[...nextauth]/route";

export const getAuthSession = async () => {
  return await getServerSession(authOptions);
};