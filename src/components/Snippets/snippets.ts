// En este archivo se encuentran las funciones que permiten la interacción con los snippets de código.
// Cuenta con una serie de funciones que interactúan con los snippets de código.
// Estas funciones se encargan de realizar acciones la eliminación y copia de snippets.
// Se utilizan las funciones de la API Fetch para realizar solicitudes al servidor y manejar la respuesta.  

const editSnippets = document.querySelectorAll("._snippet ._edit-snippet");
const deleteSnippets = document.querySelectorAll("._snippet ._delete-snippet");
const copySnippets = document.querySelectorAll("._snippet ._copy-snippet");
const expandSnippets = document.querySelectorAll("._snippet ._expand-snippet");

// DELETE SNIPPET
deleteSnippets.forEach((deleteSnippet) => {
    deleteSnippet.addEventListener("click", function (e) {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        //handleDeleteSnippet(snippetId);
        confirmDeleteSnippet(snippetId);
    });
});
function confirmDeleteSnippet(snippetId) {
    const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`);
    const snippetConfirm = snippet?.querySelector("._snippet-confirm");


    snippetConfirm?.classList.remove("hidden");
    const snippetConfirmDelete = snippetConfirm?.querySelector("._snippet-confirm-delete");
    const snippetCancelDelete = snippetConfirm?.querySelector("._snippet-confirm-cancel");

    snippetConfirmDelete?.addEventListener("click", function (e) {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        handleDeleteSnippet(snippetId);
    });

    snippetCancelDelete?.addEventListener("click", function (e) {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        snippetConfirm?.classList.add("hidden");
    });

}
async function handleDeleteSnippet(snippetId) {
    const response = await fetch("/api/deleteSnippet", {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: snippetId }),
    });
    if (!response.ok) {
        console.error("Error al eliminar el snippet:", response.statusText);
    } else {
        window.location.href = "/";
        console.log("Snippet eliminado correctamente:", snippetId);
    }
}

// COPY SNIPPET
copySnippets.forEach((copySnippet) => {
    copySnippet.addEventListener("click", function (e) {
        e.preventDefault();

        const snippetId = (e.target as HTMLElement).closest("._snippet")?.getAttribute("data-snippet-id");
        const snippetContent = (document.querySelector(`[data-snippet-id="${snippetId}"] ._snippet-content-unformated textarea`) as HTMLTextAreaElement)?.value;
        const snippet = (e.target as HTMLElement).closest("._snippet");

        if (snippetContent) {
            navigator.clipboard.writeText(snippetContent)
                .then(() => {
                    const message = snippet?.querySelector("._copy-snippet-message");
                    console.log(message);
                    message?.classList.add("is-visible");
                    setTimeout(() => {
                        message?.classList.remove("is-visible");
                    }, 3000);
                })
                .catch((err) => {
                    console.error("Error al copiar el snippet:", err);
                });
        }
    });
});

// EXPAND SNIPPET
expandSnippets.forEach((expandSnippet) => {
    expandSnippet.addEventListener("click", function (e) {
        e.preventDefault();
        const snippetId = (e.target as HTMLElement).dataset.id;
        handleExpandSnippet(snippetId);
    });
});
async function handleExpandSnippet(snippetId) {
    const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`);
    const snippetContent = snippet?.querySelector("._snippet-content");
    const snippetCloseExpanded = snippet?.querySelector("._snippet-close-expanded");
    const titleText = snippet?.querySelector("._snippet-title a")?.textContent;
    document.body.classList.add("snippet-is-expanded");
    snippet?.classList.add("is-expanded");

    snippetCloseExpanded?.addEventListener("click", function (e) {
        e.preventDefault();
        document.body.classList.remove("snippet-is-expanded");
        snippet?.classList.remove("is-expanded");
    });

}