export const prerender = false;
import type { APIRoute } from "astro";
import { supabase } from "@lib/supabaseClient";
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ cookies, redirect, request }) => {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "Usuario no autenticado" }), {
                status: 401
            });
        }

        // Eliminar snippets del usuario
        const { error: snippetsError } = await supabase
            .from('snippets')
            .delete()
            .eq('usuario_id', user.id);

        if (snippetsError) {
            return new Response(JSON.stringify({ error: "Error al eliminar snippets" }), {
                status: 500
            });
        }

        // Eliminar categorías del usuario
        const { error: categoriasError } = await supabase
            .from('categorias')
            .delete()
            .eq('usuario_id', user.id);

        if (categoriasError) {
            return new Response(JSON.stringify({ error: "Error al eliminar categorías" }), {
                status: 500
            });
        }

        // Eliminar la cuenta del usuario
        // const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);

        // if (deleteError) {
        //     console.error("Error al eliminar la cuenta:", deleteError);
        //     return new Response(JSON.stringify({ error: deleteError.message || "Error al eliminar la cuenta" }), {
        //         status: 500
        //     });
        // }

        // Cliente con service_role (NO lo pongas en el frontend)
        const supabaseAdmin = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL!,
            import.meta.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 })
        }

        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) console.error("Error signing out:", signOutError.message);

        cookies.delete("sb-access-token", { path: "/" });
        cookies.delete("sb-refresh-token", { path: "/" });

        return redirect("/");


    } catch (error) {
        return new Response(JSON.stringify({ error: "Error del servidor" }), {
            status: 500
        });
    }
};
