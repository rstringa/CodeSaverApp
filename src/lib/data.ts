import { supabase } from './supabaseClient'

export async function getSnippetsWithCategories(offset: number = 0, limit: number = 9) {
    const { data: userSession } = await supabase.auth.getSession();
    const userSessionId = userSession?.session?.user.id;

    if (!userSessionId) {
        return [];
    }

    const { data, error } = await supabase
        .from('snippets')
        .select(`
            id,
            titulo,
            contenido,
            categoria_id
        `)
        .eq('usuario_id', userSessionId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching snippets:', error);
        return [];
    }

    return data || [];
}