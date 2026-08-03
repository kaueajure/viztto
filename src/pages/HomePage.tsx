import { ArrowRight, Layers3, MessageSquareMore } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CommentPin, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'

export default function HomePage() {
  return (
    <Section className="min-h-[calc(100vh-129px)]">
      <Container>
        <div className="grid items-end gap-10 border-b border-line pb-12 lg:grid-cols-12 lg:pb-16">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-5">Fundação do produto</p>
            <h1 className="heading-xl max-w-4xl">
              Um lugar mais claro para{' '}
              <span className="font-serif font-normal italic">revisar</span> ideias.
            </h1>
          </div>
          <div className="lg:col-span-4">
            <p className="body-lg">
              A base visual e técnica do Viztto está pronta. As seções comerciais chegam na próxima
              etapa.
            </p>
            <Link
              to="/design-system"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand"
            >
              Explorar design system <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="relative mt-10 min-h-72 overflow-hidden rounded-xl border border-line bg-surface p-5 surface-grid sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Campanha de agosto</p>
              <p className="text-xs text-muted">Espaço reservado para demonstração do produto</p>
            </div>
            <div className="flex gap-2">
              <VersionBadge>v2</VersionBadge>
              <VersionBadge current>Versão atual</VersionBadge>
            </div>
          </div>
          <div className="absolute bottom-10 left-[12%] rounded-lg border border-line bg-background p-5 shadow-soft">
            <Layers3 className="mb-3 h-5 w-5 text-brand" />
            <p className="text-sm font-semibold">Material em revisão</p>
          </div>
          <div className="absolute right-[14%] top-[42%]">
            <CommentPin number={1} state="active" />
          </div>
          <div className="absolute bottom-[18%] right-[8%] hidden items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs text-white sm:flex">
            <MessageSquareMore className="h-4 w-4 text-approval" /> Linguagem visual preparada
          </div>
        </div>
      </Container>
    </Section>
  )
}
