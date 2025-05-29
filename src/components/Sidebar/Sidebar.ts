const catLink = document.querySelectorAll('._sidebar ._category-item');
const snippets = document.querySelectorAll('._snippet');
const sidebar = document.querySelector('._sidebar');
const snippetsNumber = document.querySelectorAll('_sidebar ._category-item ._number');


/**
 * Sets the current category state in the sidebar based on the value stored in sessionStorage.
*/
(function setCategoryState() {
    // const selectedCategoryId = sessionStorage.getItem('selectedCategory');
    // const selectedCategoryItem = document.querySelector(`._category-item[data-category_id="${selectedCategoryId}"]`);
    // const selectedCategoryName = selectedCategoryItem?.querySelector('._category-name')?.textContent;
    // if (selectedCategoryId && selectedCategoryId !== "0") {
    //     showSnippets(selectedCategoryId);
    //     catLink.forEach(link => link.classList.remove('is-active'));
    //     selectedCategoryItem?.classList.add('is-active');
    //     updateCategoryName(selectedCategoryName);
    // }
    categorySelectedUpdate("0");
})();

/* Update the number of snippets for each category*/
catLink.forEach(link => {
    const categoryId = (link as HTMLElement).dataset.category_id;
    const linkNumber = link.querySelector('._number');
    const totalSnippets = Array.from(snippets).filter(snippet =>
        (snippet as HTMLElement).dataset.category_id === categoryId
    ).length;
    if (linkNumber) linkNumber.textContent = totalSnippets.toString();
});

/* Handle category selection and snippet visibility */
catLink.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const categoryId = (link as HTMLElement).dataset.category_id;
        //sessionStorage.setItem('selectedCategory', categoryId || '0');
        categorySelectedUpdate(categoryId || "0");
        // sessionStorage.setItem('selectedCategoryName', categoryNameText || '');

    });
});

function categorySelectedUpdate(categoryId: string){
    const selectedCategoryItem = document.querySelector(`._category-item[data-category_id="${categoryId}"]`);
    const selectedCategoryName = selectedCategoryItem?.querySelector('._category-name')?.textContent;
    catLink.forEach(link => link.classList.remove('is-active'));

    if (categoryId && categoryId !== "0") {
        showSnippets(categoryId);
        selectedCategoryItem?.classList.add('is-active');
        updateCategoryName(selectedCategoryName);
    } else {
         showSnippets("0");
         document.querySelector('._category-item[data-category_id="0"]')?.classList.add('is-active');
        // updateCategoryName('Todos mis snippets');
    }
}

/* Update the displayed category name */
function updateCategoryName(selectedCategoryName) {
    const categoryName = document.querySelector('._content ._category-name ._category-text');
    if (categoryName) {
        setTimeout(() => {
            categoryName.textContent = selectedCategoryName || ''
        }, 50); // Allow the browser to render before updating the text
    }
}


// CLOSE ITEMS ACTIONS ON CLICK OUTSIDE
window?.addEventListener('click', function (e) {

    catLink.forEach(link => {

        let nextElement = link.nextElementSibling;
        if (nextElement && nextElement.classList.contains('_category-item-actions')) {
            nextElement.classList.add('hidden');
        }
    }
    );
});
/* Show or hide snippets based on the selected category */
function showSnippets(categoryId) {
    let hasVisibleSnippets = false;

    snippets.forEach(snippet => {

        const isVisible = categoryId === "0" || (snippet as HTMLElement).dataset.category_id === categoryId;
        snippet.classList.toggle('hidden', !isVisible);

        // Check if any snippet is visible
        if (isVisible) hasVisibleSnippets = true;
    });

    const noSnippetsMessage = document.querySelector('._no-snippets-in-category');
    if (noSnippetsMessage) {
        noSnippetsMessage.classList.toggle('hidden', hasVisibleSnippets);
    }
}



/* SHOW ACTIONS (EDIT, DELETE) */
const actions = document.querySelectorAll('._actions');
actions.forEach(action => {
    action.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        //action.classList.remove('hidden');
        (action?.closest('._category-item') as HTMLElement).click();
        (action?.closest('._category-item')?.nextElementSibling as HTMLElement)?.classList.remove('hidden');
    });
});

/* EDIT CATEGORY */
const editLinks = document.querySelectorAll('._category-item-actions ._edit-category');

editLinks.forEach(editLink => {
    editLink.addEventListener('click', function (e) {

        e.preventDefault();
        const categoryId = (e.target as HTMLElement).dataset.category_id;
        enableCategoryEditing(categoryId);
    });
});

function enableCategoryEditing(categoryId) {
    const categoryItem = document.querySelector(`[data-category_id="${categoryId}"]`);
    const categoryName = categoryItem?.querySelector('._category-name');
    const initialName = categoryName?.textContent;

    if (categoryName) {
        categoryName.setAttribute("contenteditable", "true");
        (categoryName as HTMLElement).focus();

        categoryName.addEventListener("blur", () => {
            const editedName = categoryName.textContent?.trim();
            if (editedName) {
                categoryName.textContent = sanitizeInput(editedName);
                categoryName.removeAttribute("contenteditable");
                updateCategory(categoryId, editedName);
            } else {
                categoryName.textContent = initialName || '';
            }
        });
    }
}

/* Update a category name in the backend */
async function updateCategory(categoryId, name) {
    const response = await fetch("/api/editCategory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId, name }),
    });

    if (!response.ok) {
        console.error("Error updating category:", response.statusText);
    } else {
        console.log("Category updated:", categoryId, name);
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
    const response = await fetch("/api/deleteCategory", {
        method: "DELETE",
        body: JSON.stringify({ id: categoryId }),
    });

    if (!response.ok) {
        console.error("Error deleting category:", response.statusText);
    } else {
        console.log("Category deleted:", categoryId);
        // Remove the category element from the sidebar
        const categoryElem = document.querySelector(`[data-category_id="${categoryId}"]`);
        if (categoryElem) {
            // Remove the category item and its associated actions panel if present
            const actionsPanel = categoryElem.nextElementSibling;
            categoryElem.remove();
            if (actionsPanel && actionsPanel.classList.contains('_category-item-actions')) {
                actionsPanel.remove();
            }

        }
        // Optionally, update snippet visibility or show a placeholder if no categories remain
        // e.g., showSnippets("0");
        showSnippets("0");
        updateCategoryName('Todos mis snippets');
        // Reset the selected category in sessionStorage
        sessionStorage.setItem('selectedCategory','0');
        sessionStorage.setItem('selectedCategoryName','Todos mis snippets');
    }
}

/* NEW CATEGORY */
const newCategoryModal = document.getElementById('new-category-modal');
const newCategoryLink = document.querySelector('._new_category');
const closeModal = newCategoryModal?.querySelector('._close');
const createCategoryButton = newCategoryModal?.querySelector('._create');
const messageModal = newCategoryModal?.querySelector('._message');

newCategoryLink?.addEventListener('click', (e) => {
    e.preventDefault();
    (newCategoryModal as HTMLDialogElement).showModal();
});

closeModal?.addEventListener('click', (e) => {
    e.preventDefault();
    (newCategoryModal as HTMLDialogElement).close();
});

newCategoryModal?.addEventListener('click', (e) => {
    if (e.target === newCategoryModal) {
        (newCategoryModal as HTMLDialogElement).close();
    }
});

createCategoryButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const categoryNameInput = newCategoryModal?.querySelector('._name') as HTMLInputElement;
    if (!categoryNameInput?.value.trim()) {
        if (messageModal) messageModal.textContent = "Please provide a category name.";
        return;
    }
    createCategory(categoryNameInput.value.trim());
});

async function createCategory(name) {
    const sanitizedName = sanitizeInput(name);
    const response = await fetch("/api/createCategory", {
        method: "POST",
        body: JSON.stringify({ name: sanitizedName }),
    });

    if (!response.ok) {
        console.error("Error creating category:", response.statusText);
        if (messageModal) messageModal.textContent = "Error creating category.";
    } else {
        console.log("Category created:", sanitizedName);
        window.location.reload();
    }
}

/* Utility function to sanitize input */
function sanitizeInput(input) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}



