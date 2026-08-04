import { ArrowLeft, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'

const pages: Record<string, { eyebrow: string; title: string; description: string }> = {
  '/produto': {
    eyebrow: 'Produto Viztto',
    title: 'Revisão criativa com contexto.',
    description:
      'Esta área reunirá uma visão detalhada do fluxo de materiais, comentários, versões e aprovações.',
  },
  '/recursos': {
    eyebrow: 'Recursos',
    title: 'Tudo que a revisão precisa.',
    description:
      'A página completa de recursos está sendo preparada para apresentar cada formato e etapa com clareza.',
  },
  '/precos': {
    eyebrow: 'Planos',
    title: 'Um plano para cada operação criativa.',
    description:
      'Os valores provisórios e as diferenças entre planos já podem ser consultados na página inicial.',
  },
  '/entrar': {
    eyebrow: 'Acesso ao Viztto',
    title: 'Seu espaço de trabalho estará aqui.',
    description: 'A área segura de acesso está sendo preparada para a primeira versão do Viztto.',
  },
  '/criar-conta': {
    eyebrow: 'Começar',
    title: 'A primeira versão está a caminho.',
    description: 'O cadastro será aberto quando a experiência do produto estiver pronta para uso.',
  },
  '/contato': {
    eyebrow: 'Contato',
    title: 'Vamos conversar sobre revisão criativa.',
    description: 'O canal oficial de contato será publicado junto com a primeira versão do Viztto.',
  },
  '/termos': {
    eyebrow: 'Termos de uso',
    title: 'Condições claras desde o início.',
    description:
      'Os termos definitivos serão disponibilizados antes da abertura oficial do produto.',
  },
  '/privacidade': {
    eyebrow: 'Privacidade',
    title: 'Transparência sobre seus dados.',
    description: 'A política completa de privacidade será publicada antes da abertura oficial.',
  },
}

export default function PlaceholderPage() {
  const { pathname } = useLocation()
  const content = pages[pathname] ?? pages['/produto']
  return (
    <Section className="min-h-[70vh] py-16 md:py-24">
      <Container>
        <div className="mx-auto grid max-w-2xl place-items-center rounded-xl border border-line bg-surface px-6 py-16 text-center shadow-soft sm:px-10">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
            <Sparkles aria-hidden />
          </span>
          <p className="eyebrow mt-6">{content.eyebrow}</p>
          <h1 className="heading-md mt-3">{content.title}</h1>
          <p className="mt-4 max-w-lg text-secondary">{content.description}</p>
          <Link
            to="/"
            className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar ao início
          </Link>
        </div>
      </Container>
    </Section>
  )
}
