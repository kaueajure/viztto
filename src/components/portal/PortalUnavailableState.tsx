import { Link2Off } from 'lucide-react'

export const PORTAL_UNAVAILABLE_MESSAGE =
  'O acesso pode ter sido atualizado ou revogado. Solicite um novo link para a pessoa que enviou este projeto.'

export function PortalUnavailableState({
  title = 'Este link não está disponível',
  message = PORTAL_UNAVAILABLE_MESSAGE,
}: {
  title?: string
  message?: string
}) {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-5 py-16 text-center">
      <div>
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-secondary text-secondary">
          <Link2Off className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 leading-relaxed text-secondary">{message}</p>
      </div>
    </main>
  )
}
