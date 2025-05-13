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

    if (!email || !password) throw new Error("Email o password faltantes");
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);

    // CREATE BASE CATEGORY IF IS EMAIL PROVIDER
    const userId = data.user?.id;
    if (!userId) throw new Error("Error al obtener el ID del usuario");

    const { data: existingCategory, error: fetchError } = await supabase
      .from("categorias")
      .select("*")
      .eq("usuario_id", userId)
      .eq("nombre", "Base")
      .single();

    if (!existingCategory) {
      const { error: insertError } = await supabase
        .from("categorias")
        .insert([{ usuario_id: userId, nombre: "Base" }]);

      if (insertError) {
        console.error("Error creando categoría Base:", insertError);
      }
    }

    return redirect(
      `/register?confirmEmail=${encodeURIComponent(
        "¡Bienvenido! Verifica el enlace en tu correo para confirmar tu cuenta."
      )}`
    );

  } catch (err) {
    console.error("register.ts-", err.message);
    return redirect(`/register?error=${encodeURIComponent("Error: " + err.message)}`);
  }
};
