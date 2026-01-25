import { defineMiddleware } from "astro:middleware";
import { supabase } from "@lib/supabaseClient";
import micromatch from "micromatch";

// Rutas que requieren autenticación
const protectedRoutes = [
  "/dashboard",
  "/dashboard/**",
  "/baja-de-usuario",
  "/api/createSnippet",
  "/api/editSnippet",
  "/api/deleteSnippet",
  "/api/createCategory",
  "/api/editCategory",
  "/api/deleteCategory",
  "/api/auth/deleteAccount",
  "/snippet/**"
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect } = context;
  const url = new URL(request.url);

  const accessToken = cookies.get("sb-access-token")?.value;
  const refreshToken = cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      console.error("Error setting session from cookies:", error.message);
      // Optional: clear cookies if session is invalid
    }
  }

  if (micromatch.isMatch(url.pathname, protectedRoutes)) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.warn("User not authenticated. Redirecting to /login");
      return redirect("/login");
    }
    console.log("User authenticated:", user.id);
  }

  // En todos los casos devolvemos next(), que retorna un Response
  return next();
});
