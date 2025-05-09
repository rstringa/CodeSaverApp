import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ request }) => {
  const { data: userSession } = await supabase.auth.getSession();
  const body = await request.json();
  const id = body.id;
 
  // Buscar snippet con ID
  const { data: snippet, error: snippetError } = await supabase
    .from('snippets')
    .select('*')
    .eq('id', id);

  if (snippetError || !snippet) {
    return new Response(
      JSON.stringify({ error: 'No se encontró el snippet.' }),
      { status: 500 }
    );
  }

  // Eliminar el snippet
  const { error } = await supabase
    .from('snippets')
    .delete()
    .match({ id });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });

}