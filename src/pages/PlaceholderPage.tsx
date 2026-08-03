import { ArrowLeft, Construction } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'

const names: Record<string, string> = {
  '/produto': 'Produto',
  '/recursos': 'Recursos',
  '/precos': 'Preços',
  '/entrar': 'Entrar',
  '/criar-conta': 'Criar conta',
}
export default function PlaceholderPage() {
  const { pathname } = useLocation()
  return (
    <Section className="min-h-[calc(100vh-129px)]">
      <Container>
        <div className="mx-auto grid max-w-2xl place-items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-20 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
            <Construction />
          </span>
          <p className="eyebrow mt-6">Estrutura preparada</p>
          <h1 className="heading-md mt-3">{names[pathname] ?? 'Página'}</h1>
          <p className="mt-4 max-w-md text-secondary">
            Esta rota já faz parte da arquitetura do Viztto. O conteúdo será desenvolvido em uma
            próxima etapa.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>
      </Container>
    </Section>
  )
}
