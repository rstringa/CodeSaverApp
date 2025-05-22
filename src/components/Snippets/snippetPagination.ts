import { supabase } from '@lib/supabaseClient';

let page = 1;
const SNIPPETS_PER_PAGE = 9;
let isLoading = false;
let hasMoreSnippets = true;

async function fetchSnippets(page: number) {
    try {
        const { data: userSession } = await supabase.auth.getSession();
        const userSessionId = userSession?.session?.user.id;

        if (!userSessionId) {
            return {
                snippets: [],
                hasMore: false
            };
        }

        const from = (page - 1) * SNIPPETS_PER_PAGE;
        const to = from + SNIPPETS_PER_PAGE - 1;

        const { data: snippets, error } = await supabase
            .from('snippets')
            .select(`
                id,
                titulo,
                contenido,
                categoria_id
            `)
            .eq('usuario_id', userSessionId)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching snippets:', error);
            return {
                snippets: [],
                hasMore: false
            };
        }

        return {
            snippets: snippets || [],
            hasMore: (snippets?.length || 0) === SNIPPETS_PER_PAGE
        };
    } catch (error) {
        console.error('Error fetching snippets:', error);
        return {
            snippets: [],
            hasMore: false
        };
    }
}

function renderSnippets(snippets: any[]) {
    const container = document.querySelector('._snippets-container');
    if (!container) return;

    snippets.forEach(snippet => {
        const snippetElement = createSnippetElement(snippet);
        if (snippetElement) {
            container.appendChild(snippetElement);
        }
    });
}

function createSnippetElement(snippet: any) {
    const template = document.createElement('template');
    template.innerHTML = `
        <li class="_snippet group relative mb-4" data-snippet-id="${snippet.id}" data-category_id="${snippet.categoria_id}">
            <!-- Tu estructura HTML actual del snippet -->
            <div class="_snippet-title">
                <a href="#" contenteditable="false">${snippet.titulo}</a>
            </div>
            <div class="_snippet-content">
                <pre class="hljs _snippet-content-formated">
                    <code>${snippet.contenido}</code>
                </pre>
            </div>
        </li>
    `.trim();

    return template.content.firstElementChild;
}

function setupInfiniteScroll() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && hasMoreSnippets) {
                loadMoreSnippets();
            }
        });
    }, options);

    const sentinel = document.querySelector('._snippets-sentinel');
    if (sentinel) {
        observer.observe(sentinel);
    }
}

async function loadMoreSnippets() {
    if (isLoading || !hasMoreSnippets) return;

    isLoading = true;
    const loadingIndicator = document.querySelector('._loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }

    const { snippets, hasMore } = await fetchSnippets(page + 1);
    hasMoreSnippets = hasMore;

    if (snippets.length > 0) {
        renderSnippets(snippets);
        page++;
    }

    if (loadingIndicator) {
        loadingIndicator.classList.add('hidden');
    }
    isLoading = false;
}

export function initializePagination() {
    setupInfiniteScroll();
}