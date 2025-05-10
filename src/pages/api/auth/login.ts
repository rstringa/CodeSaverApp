export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient"; 
import type { Provider } from "@supabase/auth-js";

const redirectUrl = "/";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    const provider = formData.get("provider")?.toString() as Provider;

    if (provider) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/api/auth/callback` },
      });
      if (error) throw new Error("OAuth login failed");
      return redirect(data.url);
    }

    if (!email || !password) throw new Error("Email or password missing");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error("Invalid email or password");

    cookies.set("sb-access-token", data.session.access_token, { sameSite: "none", path: "/", secure: true });
    cookies.set("sb-refresh-token", data.session.refresh_token, { sameSite: "none", path: "/", secure: true });

    return redirect(redirectUrl);
  } catch (err) {
    console.error(err.message);
    return redirect(`/login?error=${encodeURIComponent(err.message)}`);
  }
};
