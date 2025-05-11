export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";

export const POST: APIRoute = async ({ redirect }) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/api/auth/callback`,
        // queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) throw new Error("Google login failed");
    return redirect(data.url);
  } catch (err) {
    console.error(err.message);
    return redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
};