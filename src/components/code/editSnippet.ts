const editSnippetLink = document.querySelectorAll('._edit-snippet');
const deleteSnippetLink = document.querySelectorAll('._delete-snippet');

let is_editing = false;

editSnippetLink.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const snippetEditing = link.closest('._snippet');
        snippetEditing?.classList.toggle('is-editing');
        const snippetEditingTitle = snippetEditing?.querySelector('._snippet-title');
        snippetEditingTitle?.setAttribute('contenteditable', 'true');
        snippetEditingTitle?.setAttribute('spellcheck', 'false');
        const snippetEditingTitleInitial = snippetEditingTitle?.textContent;
        is_editing = !is_editing;
        // Si se esta editando un snippet,
        // Todos los ._edit-snippet que no sean el que se ha clicado, se desactivan
        if (is_editing) {

            editSnippetLink.forEach(link => {
                if (link !== snippetEditing) {
                    link.classList.remove('is-editing');
                }
            });
        }

        editSnippet(snippetEditing, snippetEditingTitleInitial as string, snippetEditingTitle as Element);
    });
});
function editSnippet(snippetEditing: Element | null, snippetEditingTitleInitial: string, snippetEditingTitle: Element | null) {
    if (snippetEditing) {

        const editingSaveLink = snippetEditing.querySelector('._save-changes');
        const editingCancelLink = snippetEditing.querySelector('._cancel-changes');


        editingSaveLink?.addEventListener('click', function (e) {
            e.preventDefault();
            const snippetEditingContent = snippetEditing?.querySelector('._snippet-content-unformated')?.textContent;
            const snippetTitle = snippetEditing?.querySelector('._snippet-title')?.textContent;
            const snippetEditingCategoria = (snippetEditing?.querySelector('._snippet-categories select') as HTMLSelectElement)?.value;
            console.log("Categoria seleccionada:", snippetEditingCategoria);

            const snippetId = (e.target as HTMLElement).dataset.id;
            saveSnippet(snippetId as string, snippetTitle as string, snippetEditingContent as string, snippetEditingCategoria as string);
        });
        editingCancelLink?.addEventListener('click', function (e) {
            e.preventDefault();
            if (snippetEditingTitle) {
                snippetEditingTitle?.setAttribute('contenteditable', 'false');
                snippetEditingTitle?.setAttribute('spellcheck', 'true');
                snippetEditingTitle.textContent = snippetEditingTitleInitial;
            }
            snippetEditing?.classList.remove('is-editing');
        });
    }
}

async function saveSnippet(
    snippetId: string,
    snippetTitle: string,
    snippetEditingContent: string,
    snippetEditingCategoria: string
) {
    console.log("Guardando snippet con ID:", snippetId);
    // Sanitize snippet title from malicius code
    snippetTitle = snippetTitle.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    try {
        const res = await fetch("/api/editSnippet", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: snippetId,
                titulo: snippetTitle,
                categoria: snippetEditingCategoria,
                contenido: snippetEditingContent,
            })
        });

        if (!res.ok) {
            console.error("Error al actualizar el snippet:", res.statusText);
            return;
        }

        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const result = await res.json();
            console.log("Snippet actualizado correctamente:", snippetId);
            window.location.href = "/";
        } else {
            console.error("La respuesta no es JSON válida.");
        }
    } catch (error) {
        console.error("Error al realizar la solicitud:", error);
    }
}