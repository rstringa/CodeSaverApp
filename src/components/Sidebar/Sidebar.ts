const catLink = document.querySelectorAll('._sidebar ._category-item');
const snippets = document.querySelectorAll('._snippet');
const sidebar = document.querySelector('._sidebar');
const snippetsNumber = document.querySelectorAll('_sidebar ._category-item ._number');
const body = document.querySelector('body');

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
        e.stopPropagation();
        const categoryId = (link as HTMLElement).dataset.category_id;
        //sessionStorage.setItem('selectedCategory', categoryId || '0');
        categorySelectedUpdate(categoryId || "0");
        const isEditable = link.querySelector('._category-name')?.getAttribute('contenteditable') === 'true';
        if (!isEditable) {

            document.body.classList.remove('categories-mobile-open');
        }

        // sessionStorage.setItem('selectedCategoryName', categoryNameText || '');

    });
});


function categorySelectedUpdate(categoryId: string) {
    const selectedCategoryItem = document.querySelector(`._category-item[data-category_id="${categoryId}"]`);
    const selectedCategoryName = selectedCategoryItem?.querySelector('._category-name')?.textContent;
    catLink.forEach(link => link.classList.remove('is-active'));

    if (categoryId && categoryId !== "0" && categoryId !== "fav") {
        showSnippets(categoryId);
        selectedCategoryItem?.classList.add('is-active');
        updateCategoryName(selectedCategoryName);
    } else if (categoryId === "fav") {
        showSnippets("fav");
        selectedCategoryItem?.classList.add('is-active');
        updateCategoryName('Favoritos');
    } else {
        showSnippets("0");
        document.querySelector('._category-item[data-category_id="0"]')?.classList.add('is-active');
        updateCategoryName('Todos mis snippets');
    }
}

/* Update the displayed category name */
function updateCategoryName(selectedCategoryName) {
    const categoryName = document.querySelector('._content ._category-name ._category-text');
    if (categoryName) {
        setTimeout(() => {
            categoryName.textContent = selectedCategoryName || '';
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
        let isVisible = false;
        if (categoryId === "0") {
            isVisible = true;
        } else if (categoryId === "fav") {
            isVisible = (snippet as HTMLElement).dataset.esFavorito === "true";
        } else {
            isVisible = (snippet as HTMLElement).dataset.category_id === categoryId;
        }

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
        if (body && !body.classList.contains('categories-mobile-open')) {
            (action?.closest('._category-item') as HTMLElement).click();
        }
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
                updateCategoryName(editedName);
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
        sessionStorage.setItem('selectedCategory', '0');
        sessionStorage.setItem('selectedCategoryName', 'Todos mis snippets');
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

/* ==========================================================================
   DRAG & DROP PARA REORDENAR CATEGORÍAS
   Mantén pulsada una categoría ~300 ms y arrástrala para cambiar su posición.
   ========================================================================== */
const DRAG_START_DISTANCE = 4;

interface CategoryDragState {
    pointerId: number;
    wrapper: HTMLElement;
    handle: HTMLElement;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    ghost: HTMLElement | null;
    active: boolean;
}

let categoryDrag: CategoryDragState | null = null;

function getCategoryScroller(): HTMLElement | null {
    return document.querySelector('._categories-scroll');
}

function getCategoryWrappers(): HTMLElement[] {
    const scroller = getCategoryScroller();
    if (!scroller) return [];
    return Array.from(scroller.querySelectorAll<HTMLElement>('._category-wrapper'));
}

function resetCategoryDrag() {
    if (!categoryDrag) return;

    categoryDrag.ghost?.remove();
    categoryDrag.wrapper.classList.remove('is-drag-placeholder');
    document.body.classList.remove('is-dragging-category');

    try {
        if (categoryDrag.handle.hasPointerCapture(categoryDrag.pointerId)) {
            categoryDrag.handle.releasePointerCapture(categoryDrag.pointerId);
        }
    } catch {
        // El puntero ya no está activo
    }

    categoryDrag = null;
}

function startCategoryDrag() {
    if (!categoryDrag) return;

    const { wrapper, startX, startY } = categoryDrag;
    const rect = wrapper.getBoundingClientRect();

    categoryDrag.offsetX = startX - rect.left;
    categoryDrag.offsetY = startY - rect.top;
    categoryDrag.active = true;

    const ghost = wrapper.cloneNode(true) as HTMLElement;
    ghost.querySelectorAll('._category-item-actions').forEach((element) => element.remove());
    ghost.classList.remove('is-active');
    ghost.classList.add('_drag-ghost');
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${rect.left}px`;
    ghost.style.top = `${rect.top}px`;
    document.body.appendChild(ghost);

    categoryDrag.ghost = ghost;
    wrapper.classList.add('is-drag-placeholder');
    document.body.classList.add('is-dragging-category');
    window.getSelection()?.removeAllRanges();
}

function autoScrollCategoryList(clientY: number) {
    const scroller = getCategoryScroller();
    if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return;

    const rect = scroller.getBoundingClientRect();
    const edge = 40;

    if (clientY < rect.top + edge) {
        scroller.scrollTop -= 14;
    } else if (clientY > rect.bottom - edge) {
        scroller.scrollTop += 14;
    }
}

function updateCategoryDragPosition(clientX: number, clientY: number) {
    if (!categoryDrag?.active || !categoryDrag.ghost) return;

    categoryDrag.ghost.style.left = `${clientX - categoryDrag.offsetX}px`;
    categoryDrag.ghost.style.top = `${clientY - categoryDrag.offsetY}px`;

    autoScrollCategoryList(clientY);

    const scroller = getCategoryScroller();
    if (!scroller) return;

    const otherWrappers = getCategoryWrappers().filter(
        (wrapper) => wrapper !== categoryDrag?.wrapper
    );

    const insertBefore = otherWrappers.find((wrapper) => {
        const rect = wrapper.getBoundingClientRect();
        return clientY < rect.top + rect.height / 2;
    });

    if (insertBefore) {
        scroller.insertBefore(categoryDrag.wrapper, insertBefore);
    } else if (otherWrappers.length > 0) {
        scroller.appendChild(categoryDrag.wrapper);
    }
}

async function saveCategoryOrder() {
    const ids = getCategoryWrappers()
        .map((wrapper) => wrapper.dataset.categoryWrapperId)
        .filter((id): id is string => Boolean(id));

    if (ids.length === 0) return;

    try {
        const response = await fetch('/api/reorderCategories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
            console.error('Error guardando el orden de las categorías:', response.statusText);
        }
    } catch (error) {
        console.error('Error guardando el orden de las categorías:', error);
    }
}

document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>('._category-drag-handle');
    if (!handle) return;

    const wrapper = handle.closest<HTMLElement>('._category-wrapper');
    if (!wrapper) return;

    if (categoryDrag) resetCategoryDrag();

    event.preventDefault();

    try {
        handle.setPointerCapture(event.pointerId);
    } catch {
        // Algunos navegadores no permiten capturar el puntero en este punto
    }

    categoryDrag = {
        pointerId: event.pointerId,
        wrapper,
        handle,
        startX: event.clientX,
        startY: event.clientY,
        offsetX: 0,
        offsetY: 0,
        ghost: null,
        active: false,
    };
});

document.addEventListener(
    'pointermove',
    (event) => {
        if (!categoryDrag || event.pointerId !== categoryDrag.pointerId) return;

        if (!categoryDrag.active) {
            const distance = Math.hypot(
                event.clientX - categoryDrag.startX,
                event.clientY - categoryDrag.startY
            );

            if (distance <= DRAG_START_DISTANCE) return;

            startCategoryDrag();
        }

        event.preventDefault();
        updateCategoryDragPosition(event.clientX, event.clientY);
    },
    { passive: false }
);

document.addEventListener('pointerup', (event) => {
    if (!categoryDrag || event.pointerId !== categoryDrag.pointerId) return;

    const wasActive = categoryDrag.active;
    resetCategoryDrag();

    if (!wasActive) return;

    saveCategoryOrder();
});

document.addEventListener('pointercancel', () => {
    const wasActive = categoryDrag?.active ?? false;
    resetCategoryDrag();

    if (wasActive) saveCategoryOrder();
});

// Evita el arrastre nativo del enlace mientras se mantiene pulsada la categoría
document.addEventListener('dragstart', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('._category-wrapper')) event.preventDefault();
});

// En táctil, evita el menú contextual mientras se usa el asa o se arrastra
document.addEventListener('contextmenu', (event) => {
    const target = event.target as HTMLElement;
    if (categoryDrag || target.closest('._category-drag-handle')) event.preventDefault();
});

document.addEventListener(
    'touchmove',
    (event) => {
        if (categoryDrag?.active) event.preventDefault();
    },
    { passive: false }
);



