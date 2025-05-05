import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';

const { data: userSession } = await supabase.auth.getSession(); 


export const POST: APIRoute = async ({ request }) => {
  const body = await request.formData();
  const titulo = body.get('titulo');
  const contenido = body.get('contenido');
 
  const categoria_id = body.get('categoria');
  const usuario_id = userSession?.session?.user.id;

  if (!usuario_id) {
    return new Response(
      JSON.stringify({ error: 'No se pudo obtener el usuario autenticado.' }),
      { status: 400 }
    );
  }

//   const { data: userExists, error: userError } = await supabase
//     .from('usuarios')
//     .select('id')
//     .eq('id', usuario_id)
//     .single();

//   if (!userExists) {
//     const { error: insertUserError } = await supabase.from('usuarios').insert([
//       { id: usuario_id, /* otros campos necesarios */ },
//     ]);

//     if (insertUserError) {
//       return new Response(
//         JSON.stringify({ error: 'No se pudo crear el usuario.' }),
//         { status: 500 }
//       );
//     }
//   }

  const { data, error } = await supabase.from('snippets').insert([
    {
      titulo,
      contenido,
      usuario_id,
      categoria_id,
      // puedes agregar usuario_id si lo manejas
    },
  ]);

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
