// Delegación robusta para snippets - funciona con el nuevo chrome Terminal Bento
// Usamos event delegation para no depender del momento de carga del módulo

function onReady(fn: () => void) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
  else fn()
  // Astro view transitions
  document.addEventListener('astro:page-load', fn as EventListener)
  document.addEventListener('astro:after-swap', fn as EventListener)
}

let _snippetListenersAttached = false
onReady(() => {
  if (_snippetListenersAttached) return
  _snippetListenersAttached = true
  console.log('[snippets.ts] handlers attached, snippets:', document.querySelectorAll('._snippet').length)
  // Usamos delegación en document para cubrir grid y detalle, y re-renders
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const deleteBtn = target.closest('._delete-snippet') as HTMLElement | null
    if (deleteBtn) {
      e.preventDefault()
      const snippetId = deleteBtn.dataset.id
      if (snippetId) confirmDeleteSnippet(snippetId)
      return
    }
    const copyBtn = target.closest('._copy-snippet') as HTMLElement | null
    if (copyBtn) {
      e.preventDefault()
      e.stopPropagation()
      const snippet = copyBtn.closest('._snippet') as HTMLElement | null
      if (!snippet) return
      // 1) textarea (fuente principal), 2) fallback al texto formateado
      const textarea = snippet.querySelector('._snippet-content-unformated textarea') as HTMLTextAreaElement | null
      let content = textarea?.value ?? ''
      if (!content) {
        const formatted = snippet.querySelector('._snippet-content-formated') as HTMLElement | null
        content = formatted?.innerText ?? formatted?.textContent ?? ''
      }
      if (!content) {
        console.warn('Copy: contenido vacío para snippet', snippet.getAttribute('data-snippet-id'))
        // aún mostramos feedback para debug
        copySnippetToClipboard('', snippet)
        return
      }
      copySnippetToClipboard(content, snippet)
      return
    }
    const favBtn = target.closest('._toggle-favorite') as HTMLElement | null
    if (favBtn) {
      e.preventDefault()
      handleFavoriteClick(favBtn)
      return
    }
    const expandBtn = target.closest('._expand-snippet') as HTMLElement | null
    if (expandBtn) {
      e.preventDefault()
      const snippetId = (expandBtn as HTMLElement).dataset.id
      if (snippetId) expandSnippetContent(snippetId)
      return
    }
    const confirmDelete = target.closest('._snippet-confirm-delete') as HTMLElement | null
    if (confirmDelete) {
      e.preventDefault()
      const snippetId = confirmDelete.dataset.id
      if (snippetId) handleDeleteSnippet(snippetId)
      return
    }
    const cancelDelete = target.closest('._snippet-confirm-cancel') as HTMLElement | null
    if (cancelDelete) {
      e.preventDefault()
      const snippet = cancelDelete.closest('._snippet')
      snippet?.querySelector('._snippet-confirm')?.classList.add('hidden')
      return
    }
    const closeExpanded = target.closest('._snippet-close-expanded') as HTMLElement | null
    if (closeExpanded) {
      e.preventDefault()
      const snippet = closeExpanded.closest('._snippet') as HTMLElement | null
      if (snippet) {
        snippet.classList.remove('is-expanded')
        document.body.classList.remove('snippet-is-expanded')
      }
      return
    }
  })
})

function confirmDeleteSnippet(snippetId: string) {
  const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`) as HTMLElement | null
  const snippetConfirm = snippet?.querySelector('._snippet-confirm') as HTMLElement | null
  if (!snippetConfirm) return
  snippetConfirm.classList.remove('hidden')
  snippetConfirm.classList.add('flex')
}

async function handleDeleteSnippet(snippetId: string) {
  try {
    const response = await fetch('/api/deleteSnippet', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: snippetId }),
    })
    if (!response.ok) {
      console.error('Error al eliminar el snippet:', response.statusText)
      return
    }
    const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`)
    snippet?.remove()
    window.location.href = '/'
  } catch (error) {
    console.error('Error al eliminar el snippet:', error)
  }
}

function showCopyFeedback(snippet: Element | null) {
  const message = snippet?.querySelector('._copy-snippet-message') as HTMLElement | null
  const messageMobile = snippet?.querySelector('._copy-snippet-message-mobile') as HTMLElement | null
  const show = (el: HTMLElement | null) => {
    if (!el) return
    el.classList.remove('hidden')
    el.classList.add('is-visible')
    el.style.display = 'flex'
    el.style.opacity = '1'
    // forzar reflow para transition
    void el.offsetWidth
  }
  const hide = (el: HTMLElement | null) => {
    if (!el) return
    el.classList.remove('is-visible')
    el.style.opacity = '0'
    setTimeout(() => {
      el.style.display = ''
      // no re-añadir hidden para no romper flex base (grid ya es flex)
    }, 300)
  }
  show(message)
  show(messageMobile)
  setTimeout(() => { hide(message); hide(messageMobile) }, 2500)
}

function copySnippetToClipboard(content: string, snippet: Element | null) {
  // si contenido vacío, igual mostramos feedback pero logueamos
  if (!content) console.warn('copySnippetToClipboard: contenido vacío')
  const doFeedback = () => showCopyFeedback(snippet)
  // intentar clipboard API
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    navigator.clipboard.writeText(content)
      .then(() => {
        console.log('Snippet copiado vía clipboard API')
        doFeedback()
      })
      .catch((err) => {
        console.warn('clipboard API falló, fallback execCommand', err)
        fallbackCopy(content, doFeedback)
      })
  } else {
    fallbackCopy(content, doFeedback)
  }
}

function fallbackCopy(content: string, cb: () => void) {
  try {
    const ta = document.createElement('textarea')
    ta.value = content
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    console.log('fallbackCopy execCommand', ok)
    cb()
  } catch (e) {
    console.error('fallbackCopy falló', e)
    cb()
  }
}

function expandSnippetContent(snippetId: string) {
  const snippet = document.querySelector(`[data-snippet-id="${snippetId}"]`) as HTMLElement | null
  const snippetContent = snippet?.querySelector('._snippet-content') as HTMLElement | null
  const closeButton = snippet?.querySelector('._snippet-close-expanded') as HTMLElement | null
  if (!snippet || !snippetContent || !closeButton) return
  document.body.classList.add('snippet-is-expanded')
  snippet.classList.add('is-expanded')
}

async function handleFavoriteClick(target: HTMLElement) {
  const id = target.dataset.id
  const isFav = target.dataset.esFavorito === 'true'
  if (!id) return
  try {
    const response = await fetch('/api/toggleFavorite', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, es_favorito: !isFav }),
    })
    if (response.ok) {
      const newStatus = !isFav
      target.dataset.esFavorito = newStatus ? 'true' : 'false'
      target.title = newStatus ? 'Quitar de favoritos' : 'Añadir a favoritos'
      const parentSnippet = target.closest('._snippet') as HTMLElement | null
      if (parentSnippet) parentSnippet.dataset.esFavorito = newStatus ? 'true' : 'false'
      const icon = target.querySelector('svg') as HTMLElement | null
      if (icon) {
        if (newStatus) {
          icon.classList.add('text-red-500!')
          icon.setAttribute('fill', 'currentColor')
        } else {
          icon.classList.remove('text-red-500!')
          icon.setAttribute('fill', 'none')
        }
      }
    }
  } catch (error) {
    console.error('Error al marcar favorito:', error)
  }
}
