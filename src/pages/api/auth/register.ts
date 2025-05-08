export const prerender = false;
import type { APIRoute } from "astro";
import type { Provider } from "@supabase/supabase-js";
import { supabase } from "@lib/supabaseClient";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  try {
    console.log("Procesando solicitud de registro...");
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
        return redirect(`/register?error=${encodeURIComponent("OAuth registration failed")}`);
      }

      return redirect(data.url);
    }

    if (!email || !password) {
      return redirect(`/register?error=${encodeURIComponent("Email or password missing")}`);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Error en signUp:", error.message);
      return redirect(`/register?error=${encodeURIComponent(error.message)}`);
    }


    // CREATE BASE CATEGORY IF IS EMAIL PROVIDER

    const userId = data.user?.id;
    if (!userId) {
      return redirect(`/register?error=${encodeURIComponent("Failed to create user")}`);
    }
    const { error: insertError } = await supabase
      .from('categorias')
      .insert([{ usuario_id: userId, nombre: 'Base' }]);

    if (insertError) {
      console.error('Error creando categoría Base:', insertError);
      return redirect(`/register?error=${encodeURIComponent("Failed to create initial category")}`);
    }
    console.log('Categoría Base creada');

    return redirect(`/login?message=${encodeURIComponent("Registration successful. Please check your email to confirm your account.")}`);

  } catch (err) {
    console.error("Error procesando la solicitud:", err);
    return redirect(`/register?error=${encodeURIComponent("An unexpected error occurred")}`);
  }
};
