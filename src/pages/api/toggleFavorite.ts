import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const PATCH: APIRoute = async ({ request, cookies }) => {
    // Sincronizar sesión
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (accessToken && refreshToken) {
        await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
        });
    }

    const { data: userSession } = await supabase.auth.getSession();
    const usuario_id = userSession?.session?.user.id;

    if (!usuario_id) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    try {
        const { id, es_favorito } = await request.json();

        const { data, error } = await supabase
            .from('snippets')
            .update({ es_favorito: es_favorito })
            .eq('id', id)
            .eq('usuario_id', usuario_id);

        if (error) {
            return new Response(JSON.stringify({ error }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }
};
