export function scrollToHash(hash: string, reduceMotion: boolean) {
  if (!hash) return false
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  const element = document.getElementById(id)
  if (!element) return false

  window.requestAnimationFrame(() => {
    element.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  })
  return true
}
