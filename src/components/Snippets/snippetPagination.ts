import { supabase } from '@lib/supabaseClient'
import hljs from 'highlight.js';
import type { Snippet } from '../../types/snippet';

let page = 1;
const SNIPPETS_PER_PAGE = 9;
let isLoading = false;
let hasMoreSnippets = true;

async function checkSession() {

    if (typeof window === 'undefined') return  // sale en servidor
    // escucha sólo en cliente
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth event:', event, session)
    })

    // 1. Intentar obtener la sesión actual
    const { data: { session }, error } = await supabase.auth.getSession();

    console.log('🔍 Verificando sesión:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error
    });

    if (session?.user) {
        return session.user;
    }

    // 2. Si no hay sesión, intentar recuperarla
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        console.log('🔄 Sesión recuperada:', user);
        return user;
    }

    // 3. Si todo falla, redirigir al login
    //window.location.href = '/login';
    return null;
}

async function fetchSnippets(page: number) {
    try {
        const user = await checkSession();

        if (!user) {
            console.error('❌ No se pudo obtener la sesión del usuario');
            return { snippets: [], hasMore: false };
        }

        const userId = user.id;
        console.log('✅ Usuario autenticado:', userId);

        // Calculate pagination range
        const from = (page - 1) * SNIPPETS_PER_PAGE;
        const to = from + SNIPPETS_PER_PAGE - 1;
        console.log(`📊 Fetching snippets range: ${from} to ${to}`);

        // Fetch snippets with user filter
        const { data: snippets, error } = await supabase
            .from('snippets')
            .select('id, titulo, contenido, categoria_id')
            .eq('usuario_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('❌ Error fetching snippets:', error);
            return { snippets: [], hasMore: false };
        }

        const hasMore = (snippets?.length || 0) === SNIPPETS_PER_PAGE;
        console.log(`📦 Fetched ${snippets?.length} snippets. Has more: ${hasMore}`);

        return { snippets: snippets || [], hasMore };
    } catch (error) {
        console.error('❌ Unexpected error:', error);
        return { snippets: [], hasMore: false };
    }
}

function createSnippetElement(snippet: Snippet): HTMLElement {
    const li = document.createElement('li');
    li.className = '_snippet group flex flex-col gap-2 rounded bg-slate-600/10 p-4 lg:p-6 text-sm transition-all transition-discrete duration-300';
    li.dataset.categoryId = snippet.categoria_id;
    li.dataset.snippetId = snippet.id;

    // Add the same HTML structure as your Snippet.astro component
    const content = hljs.highlightAuto(snippet.contenido).value;

    li.innerHTML = `
        <div class="flex flex-wrap justify-between items-center gap-2 mb-1.5 ml-2">
            <h2 class="_snippet-title flex text-xl items-center font-semibold w-full lg:max-w-80 order-2 lg:order-0">
                <a href="/snippet/${snippet.id}">${snippet.titulo}</a>
            </h2>
        </div>
        <div class="_snippet-content relative scrollbar-custom bg-slate-800 p-2 lg:p-4 rounded flex flex-col max-h-60 lg:max-h-90 overflow-y-auto scroll-smooth">
            <pre class="hljs _snippet-content-formated m-0 p-0 whitespace-pre break-words">
                <code>${content}</code>
            </pre>
        </div>
    `;

    return li;
}

function renderSnippets(snippets: Snippet[]) {
    console.log(`🎨 Intentando renderizar ${snippets.length} snippets`);
    const container = document.querySelector('._snippets-container ul');

    if (!container) {
        console.log('❌ No se encontró el contenedor para los snippets');
        return;
    }

    snippets.forEach(snippet => {
        console.log(`✏️ Renderizando snippet: ${snippet.id}`);
        const snippetElement = createSnippetElement(snippet);
        container.appendChild(snippetElement);
    });
}

async function loadMoreSnippets() {
    console.log('🔄 Iniciando carga de más snippets');
    console.log(`📌 Estado actual: isLoading=${isLoading}, hasMoreSnippets=${hasMoreSnippets}`);

    if (isLoading || !hasMoreSnippets) {
        console.log('⏸️ Carga cancelada: ya hay una carga en progreso o no hay más snippets');
        return;
    }

    isLoading = true;
    const loadingIndicator = document.querySelector('._loading-indicator');

    if (loadingIndicator) {
        console.log('💫 Mostrando indicador de carga');
        loadingIndicator.classList.remove('hidden');
    }

    try {
        console.log(`📑 Solicitando página ${page + 1}`);
        const { snippets, hasMore } = await fetchSnippets(page + 1);
        hasMoreSnippets = hasMore;

        if (snippets.length > 0) {
            console.log(`✅ ${snippets.length} nuevos snippets obtenidos`);
            renderSnippets(snippets);
            page++;
            console.log(`📄 Página actual actualizada a ${page}`);
        } else {
            console.log('ℹ️ No se obtuvieron nuevos snippets');
        }
    } finally {
        if (loadingIndicator) {
            console.log('🏁 Ocultando indicador de carga');
            loadingIndicator.classList.add('hidden');
        }
        isLoading = false;
    }
}

export function initializePagination() {
    console.log('🚀 Inicializando sistema de paginación');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            console.log(`👀 Sentinel visibility: ${entry.isIntersecting}`);
            if (entry.isIntersecting && !isLoading && hasMoreSnippets) {
                console.log('🎯 Sentinel visible - Cargando más snippets');
                loadMoreSnippets();
            }
        });
    }, {
        rootMargin: '100px'
    });

    const sentinel = document.querySelector('._snippets-sentinel');
    if (sentinel) {
        console.log('✅ Sentinel encontrado y observado');
        observer.observe(sentinel);
    } else {
        console.log('❌ No se encontró el elemento sentinel');
    }
}