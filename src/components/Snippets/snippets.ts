// Este archivo contiene las funciones principales para interactuar con los snippets de código.
// Incluye funcionalidades para eliminar, copiar y expandir snippets, utilizando eventos y solicitudes a la API.

// Selección de elementos clave
const editSnippets = document.querySelectorAll("._snippet ._edit-snippet");
const deleteSnippets = document.querySelectorAll("._snippet ._delete-snippet");
const copySnippets = document.querySelectorAll("._snippet ._copy-snippet");
const expandSnippets = document.querySelectorAll("._snippet ._expand-snippet");

// =====================
// ELIMINAR SNIPPET
// =====================

/**
 * Agrega eventos a los botones de eliminar snippet.
 */
deleteSnippets.forEach((deleteSnippet) => {
    deleteSnippet.addEventListener("click", (e) => {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        if (snippetId) confirmDeleteSnippet(snippetId);
    });
});

/**
 * Muestra la confirmación para eliminar un snippet.
 * @param snippetId - ID del snippet a eliminar.
 */
function confirmDeleteSnippet(snippetId: string) {
    const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`);
    const snippetConfirm = snippet?.querySelector("._snippet-confirm");

    if (!snippetConfirm) return;

    snippetConfirm.classList.remove("hidden");

    const confirmDeleteButton = snippetConfirm.querySelector("._snippet-confirm-delete");
    const cancelDeleteButton = snippetConfirm.querySelector("._snippet-confirm-cancel");

    // Confirmar eliminación
    confirmDeleteButton?.addEventListener("click", (e) => {
        e.preventDefault();
        handleDeleteSnippet(snippetId);
    });

    // Cancelar eliminación
    cancelDeleteButton?.addEventListener("click", (e) => {
        e.preventDefault();
        snippetConfirm.classList.add("hidden");
    });
}

/**
 * Maneja la eliminación de un snippet enviando una solicitud al servidor.
 * @param snippetId - ID del snippet a eliminar.
 */
async function handleDeleteSnippet(snippetId: string) {
    try {
        const response = await fetch("/api/deleteSnippet", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: snippetId }),
        });

        if (!response.ok) {
            console.error("Error al eliminar el snippet:", response.statusText);
            return;
        }

        console.log("Snippet eliminado correctamente:", snippetId);
        const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`);
        if (snippet) {
            snippet.remove();
        }
        window.location.href = "/"; // Recargar la página
    } catch (error) {
        console.error("Error al eliminar el snippet:", error);
    }
}

// =====================
// COPIAR SNIPPET
// =====================

/**
 * Agrega eventos a los botones de copiar snippet.
 */
copySnippets.forEach((copySnippet) => {
    copySnippet.addEventListener("click", (e) => {
        e.preventDefault();

        const snippet = (e.target as HTMLElement).closest("._snippet");
        const snippetId = snippet?.getAttribute("data-snippet-id");
        const snippetContent = snippet?.querySelector("._snippet-content-unformated textarea") as HTMLTextAreaElement;

        if (snippetContent) copySnippetToClipboard(snippetContent.value, snippet);
    });
});

/**
 * Copia el contenido de un snippet al portapapeles.
 * @param content - Contenido del snippet.
 * @param snippet - Elemento del snippet.
 */
function copySnippetToClipboard(content: string, snippet: Element | null) {
    navigator.clipboard.writeText(content)
        .then(() => {
            console.log("Snippet copiado al portapapeles.");
            const message = snippet?.querySelector("._copy-snippet-message");
            message?.classList.add("is-visible");
            setTimeout(() => message?.classList.remove("is-visible"), 3000);
        })
        .catch((err) => {
            console.error("Error al copiar el snippet:", err);
        });
}

// =====================
// EXPANDIR SNIPPET
// =====================

/**
 * Agrega eventos a los botones de expandir snippet.
 */
expandSnippets.forEach((expandSnippet) => {
    expandSnippet.addEventListener("click", (e) => {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        if (snippetId) expandSnippetContent(snippetId);
    });
});

/**
 * Expande el contenido de un snippet.
 * @param snippetId - ID del snippet a expandir.
 */
function expandSnippetContent(snippetId: string) {
    const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`);
    const snippetContent = snippet?.querySelector("._snippet-content");
    const closeButton = snippet?.querySelector("._snippet-close-expanded");

    if (!snippet || !snippetContent || !closeButton) return;

    document.body.classList.add("snippet-is-expanded");
    snippet.classList.add("is-expanded");

    // Evento para cerrar el snippet expandido
    closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        document.body.classList.remove("snippet-is-expanded");
        snippet.classList.remove("is-expanded");
    });
}

// =====================
// FAVORITOS
// =====================

const favoriteButtons = document.querySelectorAll("._toggle-favorite");

favoriteButtons.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        const id = target.dataset.id;
        const isFav = target.dataset.esFavorito === "true";

        if (!id) return;

        try {
            const response = await fetch("/api/toggleFavorite", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, es_favorito: !isFav }),
            });

            if (response.ok) {
                const newStatus = !isFav;
                target.dataset.esFavorito = newStatus ? "true" : "false";
                target.title = newStatus ? "Quitar de favoritos" : "Añadir a favoritos";

                // Actualizar el elemento padre para el filtrado
                const parentSnippet = target.closest("._snippet") as HTMLElement;
                if (parentSnippet) {
                    parentSnippet.dataset.esFavorito = newStatus ? "true" : "false";
                }

                // Actualizar icono
                const icon = target.querySelector("svg");
                if (icon) {
                    if (newStatus) {
                        icon.classList.add("text-red-500!");
                        icon.setAttribute("fill", "currentColor");
                    } else {
                        icon.classList.remove("text-red-500!");
                        icon.setAttribute("fill", "none");
                    }
                }
            }
        } catch (error) {
            console.error("Error al marcar favorito:", error);
        }
    });
});
