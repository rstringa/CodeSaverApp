import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const DELETE: APIRoute = async ({ request }) => {
  const { data: userSession } = await supabase.auth.getSession();
  const body = await request.json();
  const id = body.id;
  const usuario_id = userSession?.session?.user.id;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
      { status: 400 }
    );
  }

  // Buscar ID de categoría "Base" del mismo usuario
  const { data: baseCategoria, error: baseError } = await supabase
    .from('categorias')
    .select('id')
    .eq('nombre', 'Base')
    .eq('usuario_id', usuario_id)
    .single();

  if (baseError || !baseCategoria) {
    return new Response(
      JSON.stringify({ error: 'No se encontró la categoría Base.' }),
      { status: 500 }
    );
  }

  const baseCategoriaId = baseCategoria.id;

  // Reasignar snippets a la categoría "Base"
  const { error: updateError } = await supabase
    .from('snippets')
    .update({ categoria_id: baseCategoriaId })
    .match({ categoria_id: id, usuario_id });

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  // Eliminar la categoría
  const { error } = await supabase
    .from('categorias')
    .delete()
    .match({ id, usuario_id });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
