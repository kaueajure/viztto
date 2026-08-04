import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { ApprovalStamp, CommentPin, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { Container } from '@/components/layout/Container'
import { LinkButton } from '@/components/ui/Button'

export function FinalCtaSection() {
  return (
    <section aria-labelledby="final-cta-title" className="pb-20 pt-8 md:pb-28">
      <Container>
        <div className="relative isolate overflow-hidden rounded-xl border border-brand/35 bg-brand p-6 text-brand-contrast shadow-raised sm:p-10 lg:p-14">
          <div
            className="surface-grid pointer-events-none absolute inset-0 opacity-20"
            aria-hidden
          />
          <div
            className="absolute -right-20 -top-24 h-80 w-80 rounded-full border-[54px] border-brand-contrast/10"
            aria-hidden
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.55fr] lg:items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">
                O próximo fluxo começa organizado
              </p>
              <h2
                id="final-cta-title"
                className="mt-4 max-w-4xl text-[clamp(2.7rem,6vw,5.6rem)] font-semibold leading-[0.9] tracking-[-0.055em]"
              >
                O próximo trabalho não precisa ser aprovado pelo WhatsApp.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed opacity-80">
                Centralize o material, receba feedback claro e registre a versão aprovada em um
                único fluxo.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <LinkButton
                  to="/criar-conta"
                  variant="secondary"
                  className="border-brand-contrast bg-brand-contrast text-ink hover:bg-background"
                >
                  Começar gratuitamente <ArrowUpRight className="h-4 w-4" />
                </LinkButton>
                <LinkButton
                  to="/#como-funciona"
                  variant="outline"
                  className="!border-transparent !bg-[#f5f7fa] !text-[#0d1117] hover:!bg-[#e5e9ef]"
                >
                  Ver como funciona <ArrowDownRight className="h-4 w-4" />
                </LinkButton>
              </div>
            </div>
            <div className="relative min-h-64 rounded-lg border border-brand-contrast/20 bg-background p-5 text-ink shadow-raised">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">Campanha de agosto</p>
                  <p className="font-semibold">Versão final</p>
                </div>
                <VersionBadge approved>v4</VersionBadge>
              </div>
              <div className="relative mt-5 min-h-36 overflow-hidden rounded-md bg-revision">
                <div className="absolute -right-7 -top-8 h-28 w-28 rounded-full border-[18px] border-brand" />
                <p className="p-5 font-serif text-3xl text-background">Pronto para aprovar.</p>
                <div className="absolute bottom-5 right-7">
                  <CommentPin number={1} state="resolved" interactive={false} />
                </div>
              </div>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                <ApprovalStamp />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
