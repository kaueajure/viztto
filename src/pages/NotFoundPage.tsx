import { MessageCircleQuestion } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { LinkButton } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <Section className="min-h-[calc(100vh-129px)]">
      <Container>
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl border border-line bg-surface-secondary px-6 py-20 text-center text-ink shadow-soft surface-grid">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-revision text-background">
            <MessageCircleQuestion />
          </span>
          <p className="eyebrow mt-7 !text-muted">Erro 404 · comentário fora da tela</p>
          <h1 className="heading-lg mt-3">Esta página não passou na revisão.</h1>
          <p className="mx-auto mt-5 max-w-lg text-secondary">
            O endereço pode ter mudado ou ainda não foi publicado nesta versão.
          </p>
          <LinkButton to="/" className="mt-8">
            Voltar ao início
          </LinkButton>
        </div>
      </Container>
    </Section>
  )
}
