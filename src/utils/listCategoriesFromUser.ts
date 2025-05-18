import { supabase } from "@lib/supabaseClient"; // ajusta la ruta si es distinta

export async function listCategoriesFromUser() {
    const { data: userSession } = await supabase.auth.getSession();
    const userSessionId = userSession?.session?.user.id;

    if (!userSessionId) return [];

    const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("usuario_id", userSessionId);

    if (error) {
        console.error("Error obteniendo categorías:", error);
        return [];
    }

    return data;
}
