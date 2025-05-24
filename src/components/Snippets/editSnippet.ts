// Este archivo permite editar, guardar y cancelar cambios en snippets de código.
// También incluye la funcionalidad para actualizar un snippet en el servidor mediante una API.

// Selección de elementos clave
const editSnippetLinks = document.querySelectorAll('._edit-snippet');
const deleteSnippetLinks = document.querySelectorAll('._delete-snippet');
const currentUrl = window.location.href;

let isEditing = false;

/**
 * Inicializa la funcionalidad de edición para cada enlace de edición.
 */
editSnippetLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const snippetElement = link.closest('._snippet');
        if (!snippetElement) return;

        toggleEditingState(snippetElement, link);
    });
});

/**
 * Alterna el estado de edición de un snippet.
 * @param snippetElement - El elemento del snippet que se está editando.
 * @param clickedLink - El enlace de edición que fue clicado.
 */
function toggleEditingState(snippetElement: Element, clickedLink: Element) {
    snippetElement.classList.toggle('is-editing');
    const snippetTitleElement = snippetElement.querySelector('._snippet-title a');
    const initialTitle = snippetTitleElement?.textContent || '';
    const categoryElement = snippetElement.querySelector('._snippet-categories') as HTMLSelectElement; 
    // Habilitar edición del título
    snippetTitleElement?.setAttribute('contenteditable', 'true');
    snippetTitleElement?.setAttribute('spellcheck', 'false');

    // Habilitar edición de la categoría
    categoryElement?.classList.remove('hidden');

    isEditing = !isEditing;

    // Desactivar otros enlaces de edición mientras se edita
    if (isEditing) {
        editSnippetLinks.forEach((link) => {
            if (link !== clickedLink) {
                link.classList.remove('is-editing');
            }
        });
    }

    // Configurar eventos para guardar o cancelar cambios
    setupEditEvents(snippetElement, initialTitle, snippetTitleElement, categoryElement);
}

/**
 * Configura los eventos para guardar o cancelar cambios en un snippet.
 * @param snippetElement - El elemento del snippet que se está editando.
 * @param initialTitle - El título original del snippet antes de la edición.
 * @param snippetTitleElement - El elemento del título del snippet.
 */
function setupEditEvents(snippetElement: Element, initialTitle: string, snippetTitleElement: Element | null, categoryElement: Element | null) {
    const saveButton = snippetElement.querySelector('._save-changes');
    const cancelButton = snippetElement.querySelector('._cancel-changes');

    // Evento para guardar cambios
    saveButton?.addEventListener('click', (e) => {
        e.preventDefault();
        categoryElement?.classList.add('hidden');
        snippetElement.classList.remove('is-editing');
        saveSnippetChanges(snippetElement, snippetTitleElement);
    });

    // Evento para cancelar cambios
    cancelButton?.addEventListener('click', (e) => {
        e.preventDefault();
        snippetElement.classList.remove('is-editing');
        categoryElement?.classList.add('hidden');
        cancelSnippetChanges(snippetElement, initialTitle, snippetTitleElement);
    });
}

/**
 * Guarda los cambios realizados en un snippet.
 * @param snippetElement - El elemento del snippet que se está editando.
 * @param snippetTitleElement - El elemento del título del snippet.
 */
function saveSnippetChanges(snippetElement: Element, snippetTitleElement: Element | null) {
    const snippetContent = (snippetElement.querySelector('._snippet-content-unformated textarea') as HTMLTextAreaElement)?.value || '';
    const snippetTitle = snippetTitleElement?.textContent || '';
    const snippetCategory = (snippetElement.querySelector('._snippet-categories select') as HTMLSelectElement)?.value || '';
    const snippetId = (snippetElement.querySelector('._save-changes') as HTMLElement)?.dataset.id || '';

    console.log("Guardando snippet:", { snippetId, snippetTitle, snippetContent, snippetCategory });

    // Mostrar spinner loader
    showSpinner(snippetElement);

    saveSnippet(snippetId, snippetTitle, snippetContent, snippetCategory, snippetElement);
}

/**
 * Cancela los cambios realizados en un snippet y restaura el estado original.
 * @param snippetElement - El elemento del snippet que se está editando.
 * @param initialTitle - El título original del snippet antes de la edición.
 * @param snippetTitleElement - El elemento del título del snippet.
 */
function cancelSnippetChanges(snippetElement: Element, initialTitle: string, snippetTitleElement: Element | null) {
    if (snippetTitleElement) {
        snippetTitleElement.setAttribute('contenteditable', 'false');
        snippetTitleElement.setAttribute('spellcheck', 'true');
        snippetTitleElement.textContent = initialTitle;
    }
    snippetElement.classList.remove('is-editing');
}

/**
 * Envía los cambios de un snippet al servidor para guardarlos.
 * @param snippetId - El ID del snippet.
 * @param snippetTitle - El título del snippet.
 * @param snippetContent - El contenido del snippet.
 * @param snippetCategory - La categoría del snippet.
 * @param snippetElement - El elemento del snippet que se está editando.
 */
async function saveSnippet(snippetId: string, snippetTitle: string, snippetContent: string, snippetCategory: string, snippetElement: Element) {
    console.log("Enviando cambios al servidor para el snippet:", snippetId);

    // Sanitizar el título para evitar inyección de código
    snippetTitle = snippetTitle.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    try {
        const response = await fetch("/api/editSnippet", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: snippetId,
                titulo: snippetTitle,
                categoria: snippetCategory,
                contenido: snippetContent,
            }),
        });

        if (!response.ok) {
            console.error("Error al guardar el snippet:", response.statusText);
            return;
        }

        const result = await response.json();
        console.log("Snippet guardado correctamente:", result);

        // Ocultar spinner loader
        hideSpinner(snippetElement);

        // Actualizar la página para reflejar los cambios
        localStorage.setItem("edited-snippet", snippetId);
        window.location.href = currentUrl;
    } catch (error) {
        console.error("Error al guardar el snippet:", error);
        hideSpinner(snippetElement);
    }
}

/**
 * Muestra un spinner loader en el centro del snippet.
 * @param snippetElement - El elemento del snippet.
 */
function showSpinner(snippetElement: Element) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner-loader';
    spinner.style.position = 'absolute';
    spinner.style.top = '50%';
    spinner.style.left = '50%';
    spinner.style.transform = 'translate(-50%, -50%)';
    spinner.style.width = '40px';
    spinner.style.height = '40px';
    spinner.style.border = '4px solid #4caf50';
    spinner.style.borderTop = '4px solid transparent';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';

    snippetElement.appendChild(spinner);
}

/**
 * Oculta el spinner loader del snippet.
 * @param snippetElement - El elemento del snippet.
 */
function hideSpinner(snippetElement: Element) {
    const spinner = snippetElement.querySelector('.spinner-loader');
    spinner?.remove();
}