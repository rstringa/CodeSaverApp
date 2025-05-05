import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    // Clear the Supabase session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out from Supabase:", error.message);
    }

    // Clear the session cookies
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    // Redirect to the homepage
    return redirect("/");
  } catch (err) {
    console.error("Unexpected error during logout:", err);
    return redirect("/"); // Redirect to the homepage even if an error occurs
  }
};