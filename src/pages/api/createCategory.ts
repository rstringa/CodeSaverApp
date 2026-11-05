import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const { data: userSession } = await supabase.auth.getSession();
  const body = await request.json();
  const name = body.name;
  const usuario_id = userSession?.session?.user.id;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
      { status: 400 }
    );
  }

  // Calcular la última posición para añadir la nueva categoría al final
  const { data: lastCategory } = await supabase
    .from('categorias')
    .select('orden')
    .eq('usuario_id', usuario_id)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextOrden = (lastCategory?.orden ?? -1) + 1;

  // Crear categoría
  const { data, error } = await supabase.from('categorias').insert([
    {
      nombre: name,
      usuario_id,
      orden: nextOrden,
      // parent_id: body.parent_id,
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
