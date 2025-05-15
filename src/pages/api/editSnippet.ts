import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';
import beautify from 'js-beautify'

export const PUT: APIRoute = async ({ request }) => {
    const { data: userSession } = await supabase.auth.getSession();

    const body = await request.json();
    const id = body.id;
    const content = body.contenido;
    const title = body.titulo;
    const categoria_id = body.categoria;
    const usuario_id = userSession?.session?.user.id;


    if (!usuario_id) {
        return new Response(
            JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    const { data, error } = await supabase
        .from('snippets')
        .update({ contenido: content, categoria_id: categoria_id, titulo: title, edited_at: new Date() })
        .eq('id', id);

    if (error) {
        return new Response(
            JSON.stringify({ error }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    return new Response(
        JSON.stringify({ success: true, data }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
};
