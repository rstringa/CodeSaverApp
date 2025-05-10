export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const authCode = url.searchParams.get("code");

  if (!authCode) {
    return new Response("No code provided", { status: 400 });
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const { access_token, refresh_token } = data.session;

  cookies.set("sb-access-token", access_token, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "none", 
  });
  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "none",
  });

  // CREATE BASE CATEGORY IF IS GOOGLE PROVIDER
  const userId = data.user?.id;

  const { error: insertError } = await supabase
  .from('categorias')
  .insert([{ usuario_id: userId, nombre: 'Base' }]);

if (insertError) {
  console.error('Error creando categoría Base:', insertError);
  return redirect(`/register?error=${encodeURIComponent("Failed to create initial category")}`);
}

  return redirect("/");
};
