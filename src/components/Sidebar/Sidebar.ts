const catLink = document.querySelectorAll('._sidebar ._category-item');
const snippets = document.querySelectorAll('._snippet');
const sidebar = document.querySelector('._sidebar');
const snippetsNumber = document.querySelectorAll('_sidebar ._category-item ._number');


/* NUMBER OF SNIPPETS PER CATEGORY*/
catLink.forEach(link => {
    const categoryId = (link as HTMLElement).dataset.category_id;
    const linkNumber = link.querySelector('._number');
    const categorySnippets = Array.from(snippets).filter(snippet => (snippet as HTMLAnchorElement)?.dataset.category_id == categoryId);
    const totalSnippets = categorySnippets.length;
    if (linkNumber) {
        linkNumber.textContent = totalSnippets.toString();
    }
})

/* SHOW HIDE SNIPPETS */
catLink.forEach(link => {

    link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        catLink.forEach(link => link.classList.remove('is-active'));
        link.classList.add('is-active');
        const categoryId = (link as HTMLElement).dataset.category_id;
        const categoryNameText = link.querySelector('._category-name')?.textContent;
        showSnippets(categoryId);
        showCategoryName(categoryNameText);
        console.log(categoryNameText);
    });
});
// CLOSE ITEMS ACTIONS ON CLICK OUTSIDE
window?.addEventListener('click', function (e) {
    console.log('clickoutside');
    catLink.forEach(link => {

        let nextElement = link.nextElementSibling;
        if (nextElement && nextElement.classList.contains('_category-item-actions')) {
            nextElement.classList.add('hidden');
        }
    }
    );
});
function showSnippets(categoryId) {
    snippets.forEach(snippet => {

        const isVisible = categoryId == 0 || (snippet as HTMLElement).dataset.category_id == categoryId;
        snippet.classList.toggle('hidden', !isVisible);
    });
}
// SHOW CATEGORY NAME
function showCategoryName(editedName) {
    const categoryName = document.querySelector('._content ._category-name ._category-text');
    if (categoryName) {

        categoryName.textContent = "";
        categoryName.textContent = editedName;

    }
}


// SHOW ACTIONS (EDIT, DELETE)
const actions = document.querySelectorAll('._actions');
actions.forEach(action => {
    action.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        //action.classList.remove('hidden');
        (action?.parentElement?.parentElement?.nextElementSibling as HTMLElement)?.classList.remove('hidden');
    });
});


/* EDIT CATEGORY */
const editLinks = document.querySelectorAll('._category-item-actions ._edit-category');

editLinks.forEach(editLink => {
    editLink.addEventListener('click', function (e) {

        e.preventDefault();
        const categoryId = (e.target as HTMLElement).dataset.category_id;
        editCategory(categoryId);
    });
});

function editCategory(categoryId) {
    const category_item = document.querySelector(`[data-category_id="${categoryId}"]`);
    const category_name = category_item?.querySelector('._category-name');
    let category_name_initial = category_name?.textContent;
    category_name?.setAttribute("contenteditable", "true");
    //category_item?.querySelector('._number')?.setAttribute("contenteditable", "false");
    // Focus en el elemento editable
    if (category_name) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(category_name);
        range.collapse(false); // Cursor al final
        selection?.removeAllRanges();
        selection?.addRange(range);
        (category_name as HTMLElement).focus();
    }
    // Escuchar el evento de "blur" para guardar los cambios
    category_name?.addEventListener("blur", () => {
        let editedName = category_item?.querySelector('._category-name')?.textContent;

        // Comporobar no quede vacia y no tenga solo espacios
        // Comporbar no tenga caracteres maliciosos
        if (editedName && editedName.trim() !== "") {
            editedName = editedName.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
            const categoryNameElement = category_item?.querySelector('._category-name');
            if (categoryNameElement) {
                categoryNameElement.textContent = editedName;
                category_name?.removeAttribute("contenteditable");
                updateCategory(categoryId, editedName);
                category_name_initial = editedName;
            }

        } else {
            category_name.textContent = category_name_initial ?? '';
        }
    });
}
async function updateCategory(categoryId, editedName) {

    const response = await fetch("/api/editCategory", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            id: categoryId,
            name: editedName,
        }),

    });

    await showCategoryName(editedName);

    if (!response.ok) {
        console.error("Error al actualizar la categoría:", response.statusText);
    } else {
        console.log("Categoría actualizada correctamente:", categoryId, editedName);
    }
}

/* DELETE CATEGORY */
const deleteLinks = document.querySelectorAll('._delete-category');

deleteLinks.forEach(deleteLink => {
    deleteLink.addEventListener('click', function (e) {
        e.preventDefault();
        const categoryId = (e.target as HTMLElement).dataset.category_id;
        deleteCategory(categoryId);
    });
});

async function deleteCategory(categoryId) {
    const response = await fetch("/api/deleteCategory",
        {
            method: "DELETE",
            //  headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ id: categoryId, }),
        });
    if (!response.ok) {
        console.error("Error al eliminar la categoría:", response.statusText);
    } else {
        window.location.href = "/";
        console.log("Categoría eliminada correctamente:", categoryId);
    }
}

/* NEW CATEGORY */
const newCategoryLink = document.querySelector('._new_category');
const newCategoryModal = document.getElementById('new-category-modal');
const closeModalNewCategory = newCategoryModal?.querySelector('._close');
const createModalNewCategory = newCategoryModal?.querySelector('._create');
const messageModalNewCategory = newCategoryModal?.querySelector('._message');

newCategoryLink?.addEventListener('click', function (e) {
    e.preventDefault();
    (newCategoryModal as HTMLDialogElement).showModal();
});

closeModalNewCategory?.addEventListener('click', function (e) {
    e.preventDefault();
    (newCategoryModal as HTMLDialogElement).close();
});
newCategoryModal?.addEventListener('click', function (e) {
    if (e.target === newCategoryModal) {
        (newCategoryModal as HTMLDialogElement).close();
    }
});
createModalNewCategory?.addEventListener('click', function (e) {
    e.preventDefault();
    const categoryName = newCategoryModal?.querySelector('._name');
    if (!categoryName || !(categoryName as HTMLInputElement).value) {
        messageModalNewCategory ? messageModalNewCategory.textContent = "Asigne un nombre a la categoría." : "";
        console.error("No se encontró el input con el nombre de la categoría.");
        return;
    }
    saveNewCategory(categoryName);
});

async function saveNewCategory(categoryName) {
    // Sanitize snippet title from malicius code
    const categoryNameValue = (categoryName as HTMLInputElement).value;
    const sanitizedCategoryName = categoryNameValue.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    const response = await fetch("/api/createCategory",
        {
            method: "POST",
            //headers: { "Content-Type": "application/json", },
            body: JSON.stringify({
                name: sanitizedCategoryName,
            }),
        });
    if (!response.ok) {
        console.error("Error al crear la categoría:", response.statusText);
        if (messageModalNewCategory) {
            messageModalNewCategory.textContent = "Error al crear la categoría.";
        }
    } else {
        console.log("Categoría creada correctamente:");
        window.location.href = "/";
    }
}



