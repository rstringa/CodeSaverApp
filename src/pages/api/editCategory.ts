import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

const { data: userSession } = await supabase.auth.getSession();

export const PUT: APIRoute = async ({ request }) => {
  const body = await request.json();
  const id = body.id;
  const name = body.name;
  const usuario_id = userSession?.session?.user.id;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
      { status: 400 }
    );
  }

  const { data, error } = await supabase.from('categorias').update({ nombre: name }).eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};  