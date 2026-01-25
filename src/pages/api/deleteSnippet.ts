import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ request }) => {
    const { data: userSession } = await supabase.auth.getSession();
    const usuario_id = userSession?.session?.user.id;

    if (!usuario_id) {
        return new Response(
            JSON.stringify({ error: 'No autorizado' }),
            { status: 401 }
        );
    }

    const body = await request.json();
    const id = body.id;

    // Buscar snippet con ID y usuario_id
    const { data: snippet, error: snippetError } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', usuario_id)
        .single();

    if (snippetError || !snippet) {
        return new Response(
            JSON.stringify({ error: 'No se encontró el snippet o no tienes permisos.' }),
            { status: 404 }
        );
    }

    // Eliminar el snippet
    const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuario_id);

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

}