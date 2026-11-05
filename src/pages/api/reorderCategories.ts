import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ request }) => {
  const { data: userSession } = await supabase.auth.getSession();
  const usuario_id = userSession?.session?.user.id;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
      { status: 400 }
    );
  }

  const body = await request.json();
  const ids: string[] = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown) => typeof id === 'string')
    : [];

  if (ids.length === 0) {
    return new Response(JSON.stringify({ error: 'No se recibieron categorías.' }), { status: 400 });
  }

  // Comprobar que todas las categorías pertenecen al usuario
  const { data: ownedCategories, error: fetchError } = await supabase
    .from('categorias')
    .select('id')
    .eq('usuario_id', usuario_id)
    .in('id', ids);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
  }

  const ownedIds = new Set((ownedCategories ?? []).map((categoria) => categoria.id));
  const validIds = ids.filter((id) => ownedIds.has(id));

  const results = await Promise.all(
    validIds.map((id, index) =>
      supabase
        .from('categorias')
        .update({ orden: index })
        .eq('id', id)
        .eq('usuario_id', usuario_id)
    )
  );

  const updateError = results.find((result) => result.error)?.error;

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
