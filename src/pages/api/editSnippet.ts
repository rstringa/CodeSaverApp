// Edit Snippet
// Este archivo contiene una función que permite editar un snippet de código en la base de datos.
// La función recibe un objeto JSON con los datos necesarios para actualizar el snippet.
// La función utiliza la API Fetch para realizar solicitudes al servidor y manejar la respuesta.
// La función devuelve un objeto JSON con el resultado de la operación.

import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

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
