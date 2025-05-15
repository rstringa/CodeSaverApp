// Este archivo contiene una función que permite crear un snippet de código en la base de datos.
// La función recibe un objeto JSON con los datos necesarios para crear el snippet.
// La función utiliza la API Fetch para realizar solicitudes al servidor y manejar la respuesta.
// La función devuelve un objeto JSON con el resultado de la operación. 


import { supabase } from '@lib/supabaseClient';
import type { APIRoute } from 'astro';


export const POST: APIRoute = async ({ request }) => {
  const { data: userSession } = await supabase.auth.getSession();
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

  console.log(categoria_id, 'categoria_id');

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
    console.error('Error al insertar el snippet:', error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, data }), { status: 200 });
};
