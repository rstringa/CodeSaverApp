const catLink = document.querySelectorAll('._sidebar ._category-item');
const snippets = document.querySelectorAll('._snippet');
const sidebar = document.querySelector('._sidebar');
/* SHOW HIDE SNIPPETS */
catLink.forEach(link => {
    
    link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        catLink.forEach(link => link.classList.remove('_active'));
        link.classList.add('_active');
        const categoryId = (link as HTMLElement).dataset.category_id;
        const categoryNameText = link.querySelector('span')?.textContent;
        showSnippets(categoryId);
        showCategoryName(categoryNameText);
    });
});
// CLOSE ITEMS ACTIONS ON CLICK OUTSIDE
window?.addEventListener('click', function (e) {
    console.log('clickoutside');
    catLink.forEach( link => 
    {
       
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
function showCategoryName(categoryNameText) {
    const categoryName = document.querySelector('._top ._category-name ._category-text');
    if (categoryName) {
        categoryName.textContent = categoryNameText;
    }
}


// SHOW ACTIONS (EDIT, DELETE)
const actions = document.querySelectorAll('._actions');
actions.forEach(action => {
    action.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation(); 
        (action?.parentElement?.parentElement?.nextElementSibling as HTMLElement)?.classList.toggle('hidden');
    });
});


/* EDIT CATEGORY */
const editLink = document.querySelectorAll('._edit');

editLink.forEach(editLink => {
    editLink.addEventListener('click', function (e) {
        e.preventDefault();
        const categoryId = (e.target as HTMLElement).dataset.category_id;
        editCategory(categoryId);
    });
});

function editCategory(categoryId) {
    const category_item = document.querySelector(`[data-category_id="${categoryId}"]`);
    category_item?.setAttribute("contenteditable", "true");
    (category_item as HTMLElement).focus();
    category_item?.addEventListener("blur", () => {
        category_item?.removeAttribute("contenteditable");
        const editedName = category_item?.textContent;
        if (editedName) {
            updateCategory(categoryId, editedName);
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

    if (!response.ok) {
        console.error("Error al actualizar la categoría:", response.statusText);
    } else {
        console.log("Categoría actualizada correctamente:", categoryId, editedName);
    }
}

/* DELETE CATEGORY */
const deleteLinks = document.querySelectorAll('._delete');

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
newCategoryModal ?.addEventListener('click', function (e) {
    if (e.target === newCategoryModal ) {
      (newCategoryModal  as HTMLDialogElement).close();
      }
  });
createModalNewCategory?.addEventListener('click', function (e) {
    e.preventDefault();
    const categoryName = newCategoryModal?.querySelector('._name');
    if (!categoryName) {
        console.error("No se encontró el input con el nombre de la categoría.");
        return;
    }
    saveNewCategory(categoryName);
});

async function saveNewCategory(categoryName) {
    const response = await fetch("/api/createCategory",
        {
            method: "POST",
            //headers: { "Content-Type": "application/json", },
            body: JSON.stringify({ 
                  name: (categoryName as HTMLInputElement).value,  
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



