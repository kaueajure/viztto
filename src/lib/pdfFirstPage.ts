import { loadPdfDocument } from '@/lib/pdfDocument'

const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

async function renderFirstPage(url: string): Promise<string> {
  const doc = await loadPdfDocument(url)
  const page = await doc.getPage(1)
  const viewport = page.getViewport({ scale: 0.45 })
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.floor(viewport.width))
  canvas.height = Math.max(1, Math.floor(viewport.height))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível')
    await page.render({ canvasContext: context, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.72)
}

/** Renderiza a 1ª página do PDF em data-URL com cache em memória. */
export function loadPdfFirstPageThumbnail(url: string): Promise<string> {
  const cached = cache.get(url)
  if (cached) return Promise.resolve(cached)
  const pending = inflight.get(url)
  if (pending) return pending
  const job = renderFirstPage(url)
    .then((dataUrl) => {
      cache.set(url, dataUrl)
      inflight.delete(url)
      return dataUrl
    })
    .catch((erro) => {
      inflight.delete(url)
      throw erro
    })
  inflight.set(url, job)
  return job
}
