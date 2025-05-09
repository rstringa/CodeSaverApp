export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";
import type { Provider } from "@supabase/auth-js";

export const POST: APIRoute = async ({ request, redirect }) => {
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
      if (error) throw new Error("OAuth registration failed");
      return redirect(data.url);
    }

    if (!email || !password) throw new Error("Email or password missing");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // CREATE BASE CATEGORY IF IS EMAIL PROVIDER
    const userId = data.user?.id;
    if (!userId) throw new Error("Failed to create user");

    const { error: insertError } = await supabase.from("categorias").insert([{ usuario_id: userId, nombre: "Base" }]);
    if (insertError) throw new Error("Failed to create initial category");

    return redirect(`/login?message=${encodeURIComponent("Registration successful. Please check your email to confirm your account.")}`);
  } catch (err) {
    console.error("register.ts-",err.message);
    return redirect(`/register?error=${encodeURIComponent(err.message)}`);
  }
};
