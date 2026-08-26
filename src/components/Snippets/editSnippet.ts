// Edición robusta con delegación - compatible con nuevo chrome Terminal Bento
import hljs from 'highlight.js';

let isEditing = false;

function onReady(fn: () => void) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
  else fn()
}

onReady(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const editBtn = target.closest('._edit-snippet') as HTMLElement | null
    if (editBtn) {
      e.preventDefault()
      const snippetElement = editBtn.closest('._snippet') as HTMLElement | null
      if (!snippetElement) return
      toggleEditingState(snippetElement, editBtn)
      return
    }
    const saveBtn = target.closest('._save-changes') as HTMLElement | null
    if (saveBtn) {
      e.preventDefault()
      const snippetElement = saveBtn.closest('._snippet') as HTMLElement | null
      if (!snippetElement) return
      const titleEl = snippetElement.querySelector('._snippet-title a') as HTMLElement | null
      // ocultar categorías si se usa hidden manual (fallback)
      const catContainer = snippetElement.querySelector('._snippet-categories') as HTMLElement | null
      catContainer?.classList.add('hidden')
      snippetElement.classList.remove('is-editing')
      saveSnippetChanges(snippetElement, titleEl)
      isEditing = false
      return
    }
    const cancelBtn = target.closest('._cancel-changes') as HTMLElement | null
    if (cancelBtn) {
      e.preventDefault()
      const snippetElement = cancelBtn.closest('._snippet') as HTMLElement | null
      if (!snippetElement) return
      const titleEl = snippetElement.querySelector('._snippet-title a') as HTMLElement | null
      const initialTitle = (titleEl?.dataset.initialTitle || titleEl?.textContent || '')
      const catContainer = snippetElement.querySelector('._snippet-categories') as HTMLElement | null
      catContainer?.classList.add('hidden')
      cancelSnippetChanges(snippetElement, initialTitle, titleEl)
      isEditing = false
      return
    }
  })
})

function toggleEditingState(snippetElement: Element, clickedLink: Element) {
  const isNowEditing = !snippetElement.classList.contains('is-editing')
  // si vamos a editar, cerramos otros
  if (isNowEditing) {
    document.querySelectorAll('._snippet.is-editing').forEach(el => {
      if (el !== snippetElement) {
        el.classList.remove('is-editing')
        const t = el.querySelector('._snippet-title a') as HTMLElement | null
        if (t) { t.setAttribute('contenteditable','false'); t.setAttribute('spellcheck','true') }
        const c = el.querySelector('._snippet-categories') as HTMLElement | null
        c?.classList.add('hidden')
      }
    })
  }
  snippetElement.classList.toggle('is-editing')
  const snippetTitleElement = snippetElement.querySelector('._snippet-title a') as HTMLElement | null
  const categoryContainer = snippetElement.querySelector('._snippet-categories') as HTMLElement | null
  if (!snippetTitleElement) return
  // guardar título inicial para cancelar
  if (!snippetTitleElement.dataset.initialTitle) {
    snippetTitleElement.dataset.initialTitle = snippetTitleElement.textContent || ''
  }
  if (snippetElement.classList.contains('is-editing')) {
    snippetTitleElement.setAttribute('contenteditable', 'true')
    snippetTitleElement.setAttribute('spellcheck', 'false')
    snippetTitleElement.focus()
    // seleccionar texto
    try {
      const range = document.createRange()
      range.selectNodeContents(snippetTitleElement)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } catch {}
    categoryContainer?.classList.remove('hidden')
    isEditing = true
  } else {
    snippetTitleElement.setAttribute('contenteditable', 'false')
    snippetTitleElement.setAttribute('spellcheck', 'true')
    categoryContainer?.classList.add('hidden')
    isEditing = false
  }
}

function saveSnippetChanges(snippetElement: Element, snippetTitleElement: Element | null) {
  const snippetContent = (snippetElement.querySelector('._snippet-content-unformated textarea') as HTMLTextAreaElement)?.value || ''
  const snippetTitle = snippetTitleElement?.textContent || ''
  const snippetCategory = (snippetElement.querySelector('._snippet-categories select') as HTMLSelectElement)?.value || ''
  const snippetId = (snippetElement.querySelector('._save-changes') as HTMLElement)?.dataset.id || (snippetElement as HTMLElement).dataset.snippetId || ''
  showSpinner(snippetElement)
  // limpiar dataset inicial
  if (snippetTitleElement) delete (snippetTitleElement as HTMLElement).dataset.initialTitle
  saveSnippet(snippetId, snippetTitle, snippetContent, snippetCategory, snippetElement)
}

function cancelSnippetChanges(snippetElement: Element, initialTitle: string, snippetTitleElement: Element | null) {
  if (snippetTitleElement) {
    snippetTitleElement.setAttribute('contenteditable', 'false')
    snippetTitleElement.setAttribute('spellcheck', 'true')
    snippetTitleElement.textContent = initialTitle
    delete (snippetTitleElement as HTMLElement).dataset.initialTitle
  }
  snippetElement.classList.remove('is-editing')
}

async function saveSnippet(snippetId: string, snippetTitle: string, snippetContent: string, snippetCategory: string, snippetElement: Element) {
  snippetTitle = snippetTitle.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  snippetCategory = snippetCategory.replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  try {
    const token = sessionStorage.getItem('sb-access-token')
    const response = await fetch('/api/editSnippet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ id: snippetId, titulo: snippetTitle, categoria: snippetCategory, contenido: snippetContent }),
    })
    if (!response.ok) {
      console.error('Error al guardar el snippet:', response.statusText)
      hideSpinner(snippetElement)
      return
    }
    const result = await response.json()
    const snippetTitleElement = snippetElement.querySelector('._snippet-title a') as HTMLElement | null
    if (snippetTitleElement) {
      snippetTitleElement.textContent = snippetTitle
      snippetTitleElement.setAttribute('contenteditable', 'false')
      snippetTitleElement.setAttribute('spellcheck', 'true')
    }
    const snippetContentElement = snippetElement.querySelector('._snippet-content-formated') as HTMLElement | null
    if (snippetContentElement) {
      const formatted = hljs.highlightAuto(snippetContent).value
      snippetContentElement.innerHTML = formatted
      snippetContentElement.setAttribute('contenteditable', 'false')
      snippetContentElement.setAttribute('spellcheck', 'true')
    }
    // actualizar textarea también para próximo copy
    const textarea = snippetElement.querySelector('._snippet-content-unformated textarea') as HTMLTextAreaElement | null
    if (textarea) textarea.value = snippetContent
    ;(snippetElement as HTMLElement).dataset.category_id = snippetCategory
    snippetElement.setAttribute('data-category_id', snippetCategory)
    hideSpinner(snippetElement)
    sessionStorage.setItem('edited-snippet', snippetId)
    setTimeout(() => updateCategoriesNumber(), 100)
  } catch (error) {
    console.error('Error al guardar el snippet:', error)
    hideSpinner(snippetElement)
  }
}

function updateCategoriesNumber() {
  const catLink = document.querySelectorAll('._sidebar ._category-item')
  const snippets = document.querySelectorAll('._snippet')
  catLink.forEach(link => {
    const categoryId = (link as HTMLElement).dataset.category_id
    const linkNumber = link.querySelector('._number') as HTMLElement | null
    const totalSnippets = Array.from(snippets).filter(snippet => (snippet as HTMLElement).dataset.category_id === categoryId).length
    if (linkNumber) linkNumber.textContent = totalSnippets.toString()
    const actualCategorySelected = document.querySelector('._sidebar ._category-item.is-active') as HTMLElement | null
    if (actualCategorySelected) actualCategorySelected.click()
  })
}

function showSpinner(snippetElement: Element) {
  if (snippetElement.querySelector('.spinner-loader')) return
  const spinner = document.createElement('div')
  spinner.className = 'spinner-loader'
  Object.assign(spinner.style, {
    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    width: '40px', height: '40px', border: '4px solid #4caf50', borderTop: '4px solid transparent',
    borderRadius: '50%', animation: 'spin 1s linear infinite', zIndex: '10'
  } as any)
  ;(snippetElement as HTMLElement).style.position = 'relative'
  snippetElement.appendChild(spinner)
}
function hideSpinner(snippetElement: Element) {
  snippetElement.querySelector('.spinner-loader')?.remove()
}
