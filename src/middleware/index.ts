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
  "/api/auth/deleteAccount"
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect } = context;
  const url = new URL(request.url);

  if (micromatch.isMatch(url.pathname, protectedRoutes)) {
    const token = cookies.get("sb-access-token")?.value;
    if (!token) {
      console.warn("Token missing. Redirecting to /login");
      return redirect("/login");
    }

    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error("Invalid token. Redirecting to /login");
      return redirect("/login");
    }
    console.log("User authenticated:", user);
  }

  // En todos los casos devolvemos next(), que retorna un Response
  return next();
});
