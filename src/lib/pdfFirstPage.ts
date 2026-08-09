import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

let workerConfigured = false

function ensureWorker() {
  if (workerConfigured) return
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  workerConfigured = true
}

const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

async function renderFirstPage(url: string): Promise<string> {
  ensureWorker()
  let doc: PDFDocumentProxy | null = null
  try {
    doc = await getDocument({ url, withCredentials: false }).promise
    const page = await doc.getPage(1)
    const viewport = page.getViewport({ scale: 0.45 })
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.floor(viewport.width))
    canvas.height = Math.max(1, Math.floor(viewport.height))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponível')
    await page.render({ canvasContext: context, viewport }).promise
    return canvas.toDataURL('image/jpeg', 0.72)
  } finally {
    await doc?.destroy().catch(() => undefined)
  }
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
