import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error signing out:", error.message);

    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

    return redirect("/");
  } catch (err) {
    console.error("Unexpected error during logout:", err);
    return redirect("/");
  }
};