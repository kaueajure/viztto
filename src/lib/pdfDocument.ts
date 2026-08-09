import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'

let workerConfigured = false

export function ensurePdfWorker() {
  if (workerConfigured) return
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()
  workerConfigured = true
}

const docs = new Map<string, Promise<PDFDocumentProxy>>()

/** Carrega e cacheia o documento PDF por URL (evita reabrir em listas/revisão). */
export function loadPdfDocument(url: string): Promise<PDFDocumentProxy> {
  ensurePdfWorker()
  const existing = docs.get(url)
  if (existing) return existing
  const job = getDocument({ url, withCredentials: false }).promise.catch((erro) => {
    docs.delete(url)
    throw erro
  })
  docs.set(url, job)
  return job
}
