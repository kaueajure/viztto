import { MessageCircleQuestion } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { LinkButton } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <Section className="min-h-[calc(100vh-129px)]">
      <Container>
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl bg-ink px-6 py-20 text-center text-white surface-grid">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-revision text-white">
            <MessageCircleQuestion />
          </span>
          <p className="eyebrow mt-7 !text-white/55">Erro 404 · comentário fora da tela</p>
          <h1 className="heading-lg mt-3">Esta página não passou na revisão.</h1>
          <p className="mx-auto mt-5 max-w-lg text-white/65">
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
