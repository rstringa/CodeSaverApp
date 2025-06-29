// Este archivo permite editar, guardar y cancelar cambios en snippets de código.
// También incluye la funcionalidad para actualizar un snippet en el servidor mediante una API.
import hljs from 'highlight.js';
// Selección de elementos clave
const editSnippetLinks = document.querySelectorAll('._edit-snippet');
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

    // Sanitizar el título y el contenido para evitar inyección de código
    snippetTitle = snippetTitle.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    snippetCategory = snippetCategory.replaceAll("<", "&lt;").replaceAll(">", "&gt;");

    try {
        // ✅ CORRECCIÓN: Usar cookies en lugar de sessionStorage
        const response = await fetch("/api/editSnippet", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: 'include', // 👈 Esto envía las cookies automáticamente
            body: JSON.stringify({
                id: snippetId,
                titulo: snippetTitle,
                categoria: snippetCategory,
                contenido: snippetContent,
            }),
        });

        // ✅ CORRECCIÓN: Mejor manejo de errores
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            console.error("Error al parsear respuesta JSON:", jsonError);
            hideSpinner(snippetElement);
            alert("Error al guardar: Respuesta inválida del servidor");
            return;
        }

        if (!response.ok) {
            console.error("Error al guardar el snippet:", response.status, response.statusText, result);
            hideSpinner(snippetElement);
            
            // ✅ MOSTRAR ERROR AL USUARIO
            const errorMessage = result?.error || `Error ${response.status}: ${response.statusText}`;
            alert(`Error al guardar el snippet: ${errorMessage}`);
            return;
        }

        console.log("Snippet guardado correctamente:", result);

        // Actualizar el contenido del snippet en la interfaz formateada mostrando los cambios editados.
        const snippetTitleElement = snippetElement.querySelector('._snippet-title a');
        if (snippetTitleElement) {
            snippetTitleElement.textContent = snippetTitle;
            snippetTitleElement.setAttribute('contenteditable', 'false');
            snippetTitleElement.setAttribute('spellcheck', 'true');
        }
        const snippetContentElement = snippetElement.querySelector('._snippet-content-formated');
        
        if (snippetContentElement) {
            const snippetContentElementFormated = hljs.highlightAuto(snippetContent).value;
            snippetContentElement.innerHTML = snippetContentElementFormated;
            snippetContentElement.setAttribute('contenteditable', 'false');
            snippetContentElement.setAttribute('spellcheck', 'true');
        }

        snippetElement.setAttribute('data-category_id', snippetCategory);
        
        // Ocultar spinner loader
        hideSpinner(snippetElement);

        // Actualizar el ID del snippet editado en el sessionStorage
        sessionStorage.setItem("editedSnippet", snippetId);

        // Actualizar el número de snippets en cada categoría del Sidebar
        setTimeout(() => {
            updateCategoriesNumber();
        }, 100);

    } catch (error) {
        console.error("Error al guardar el snippet:", error);
        hideSpinner(snippetElement);
        
        // ✅ MOSTRAR ERROR AL USUARIO
        const errorMessage = error instanceof Error ? error.message : "Error de conexión";
        alert(`Error al guardar el snippet: ${errorMessage}`);
    }
}

/**
 * Update Categories Number
 */
function updateCategoriesNumber() {
    const catLink = document.querySelectorAll('._sidebar ._category-item');
    const snippets = document.querySelectorAll('._snippet');
    catLink.forEach(link => {
        
        const categoryId = (link as HTMLElement).dataset.category_id;
        const linkNumber = link.querySelector('._number');
        const totalSnippets = Array.from(snippets).filter(snippet =>
            (snippet as HTMLElement).dataset.category_id === categoryId
        ).length;
        if (linkNumber) linkNumber.textContent = totalSnippets.toString();

        // Hacer click en la categoria seleccionada para renovar la vista de snippets
        const actualCategorySelected = document.querySelector('._sidebar ._category-item.is-active');
        if( actualCategorySelected ) {
            (actualCategorySelected as HTMLElement).click();
        }
    });
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