export const prerender = false;
import type { APIRoute } from "astro";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@lib/supabaseClient"; 

const redirectUrl = "/";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log("Procesando solicitud...");
    const formData = await request.formData();

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const provider = formData.get("provider")?.toString();

    if (provider) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/api/auth/callback`,
        },
      });

      if (error) {
        console.error("Error en signInWithOAuth:", error.message);
        return redirect(`/login?error=${encodeURIComponent("OAuth login failed")}`);
      }

      return redirect(data.url);
    }

    if (!email || !password) {
      return redirect(`/login?error=${encodeURIComponent("Email or password missing")}`);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error en signInWithPassword:", error.message);
      return redirect(`/login?error=${encodeURIComponent("Invalid email or password")}`);
    }

    const { access_token, refresh_token } = data.session;
    cookies.set("sb-access-token", access_token, {
      sameSite: "strict",
      path: "/",
      secure: true,
    });
    cookies.set("sb-refresh-token", refresh_token, {
      sameSite: "strict",
      path: "/",
      secure: true,
    });

    return redirect(redirectUrl);
  } catch (err) {
    console.error("Error procesando la solicitud:", err);
    return redirect(`/login?error=${encodeURIComponent("An unexpected error occurred")}`);
  }
};
