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

  // Agregar logs para depuración
  console.log('Usuario autenticado:', usuario_id);
  console.log('ID de categoría a eliminar:', id);

  // Buscar ID de categoría "Base" del mismo usuario
  const { data: baseCategoria, error: baseError } = await supabase
    .from('categorias')
    .select('id')
    .eq('nombre', 'Base')
    .eq('usuario_id', usuario_id)
    .single();

  // Verificar si se encontró la categoría "Base"
  if (baseError || !baseCategoria) {
    console.error('Error al buscar categoría Base:', baseError);
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

  // Verificar si hubo error al reasignar snippets
  if (updateError) {
    console.error('Error al reasignar snippets:', updateError.message);
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  // Eliminar la categoría
  const { error } = await supabase
    .from('categorias')
    .delete()
    .match({ id, usuario_id });

  // Verificar si hubo error al eliminar la categoría
  if (error) {
    console.error('Error al eliminar la categoría:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
