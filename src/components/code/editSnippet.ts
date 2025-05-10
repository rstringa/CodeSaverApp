const editSnippetLink = document.querySelectorAll('._edit-snippet');
const deleteSnippetLink = document.querySelectorAll('._delete-snippet');
let is_editing = false;

editSnippetLink.forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();

        const snippetEditing = link.closest('._snippet');
        snippetEditing?.classList.toggle('is-editing');
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

        editSnippet(snippetEditing);
    });
});
function editSnippet(snippetEditing: Element | null) {
    if (snippetEditing) {
        //is_editing = !is_editing;
        const snippetContent = snippetEditing?.querySelector('._snippet-content');
        const snippetTitle = snippetEditing?.querySelector('._snippet-title');
        const snippetContentCode = snippetContent?.querySelector('pre');
        snippetContentCode?.setAttribute('contenteditable', String(is_editing));
        snippetTitle?.setAttribute('contenteditable', String(is_editing));
    }
}
