
import { Handler } from "sst/node/auth";
import { createClient } from "@supabase/supabase-js";

export const handler: Handler = async (event) => {
  const { token, context } = event;
  
  // Validate token with Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        context: {
          userId: data.user.id,
          email: data.user.email,
          // Additional user context
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
};