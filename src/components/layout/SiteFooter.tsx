import { Link } from 'react-router-dom'
import { Logo } from '@/components/brand/Logo'
import { Container } from '@/components/layout/Container'
import { HashLink } from '@/components/navigation/HashLink'

const columns = [
  {
    title: 'Produto',
    links: [
      ['Como funciona', '/#como-funciona'],
      ['Recursos', '/#recursos'],
      ['Para quem', '/#publicos'],
      ['Preços', '/#precos'],
    ],
  },
  {
    title: 'Formatos',
    links: [
      ['Imagens', '/#recursos'],
      ['Vídeos', '/#recursos'],
      ['PDFs', '/#recursos'],
      ['Apresentações', '/#recursos'],
      ['Sites', '/#recursos'],
    ],
  },
  {
    title: 'Empresa',
    links: [
      ['Contato', '/contato'],
      ['Perguntas frequentes', '/#faq'],
      ['Termos', '/termos'],
      ['Privacidade', '/privacidade'],
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface/45 py-12 md:py-16">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.35fr_repeat(3,0.65fr)]">
          <div>
            <Link to="/" aria-label="Viztto — página inicial">
              <Logo />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-secondary">
              Revisão, feedback e aprovação de materiais criativos no lugar certo.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sm font-semibold">{column.title}</p>
              <ul className="mt-4 grid gap-3">
                {column.links.map(([label, to]) => (
                  <li key={label}>
                    {to.includes('#') ? (
                      <HashLink
                        to={to}
                        className="inline-flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-brand"
                      >
                        {label}
                      </HashLink>
                    ) : (
                      <Link
                        to={to}
                        className="inline-flex min-h-11 items-center text-sm text-secondary transition-colors hover:text-brand"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 border-t border-line pt-6 text-xs text-muted">
          © 2026 Viztto. Todos os direitos reservados.
        </div>
      </Container>
    </footer>
  )
}
