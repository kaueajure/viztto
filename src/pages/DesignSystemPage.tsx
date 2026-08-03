import { ArrowDown } from 'lucide-react'
import { BrandFoundation } from '@/components/design-system/FoundationSections'
import { ControlSections } from '@/components/design-system/ControlSections'
import { PatternSections } from '@/components/design-system/PatternSections'
import { ProductSections } from '@/components/design-system/ProductSections'
import { CollaborativeCursor, CommentPin } from '@/components/feedback/FeedbackComponents'
import { Container } from '@/components/layout/Container'

const anchors = [
  ['Marca', '#marca'],
  ['Cores', '#cores'],
  ['Tipografia', '#tipo'],
  ['Controles', '#acoes'],
  ['Comentários', '#comentarios'],
  ['Versões', '#versoes'],
  ['Padrões', '#feedback'],
]

export default function DesignSystemPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface-secondary py-16 text-ink md:py-24">
        <Container>
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="eyebrow !text-muted">Viztto · Design System 0.1</p>
              <h1 className="mt-5 text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[.82] tracking-[-.07em]">
                Clareza para
                <br />
                <span className="font-serif font-normal italic text-brand">ver juntos.</span>
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="max-w-md text-lg leading-relaxed text-secondary">
                Uma linguagem visual para colocar decisões, comentários e versões no contexto certo.
              </p>
              <a
                href="#marca"
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-approval"
              >
                Explorar fundação <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="absolute right-[8%] top-[23%] hidden lg:block">
            <CollaborativeCursor name="Você" color="revision" />
          </div>
          <div className="absolute bottom-[12%] left-[56%] hidden lg:block">
            <CommentPin number={1} state="resolved" />
          </div>
        </Container>
      </section>
      <div className="sticky top-0 z-20 overflow-x-auto border-b border-line bg-background/95 backdrop-blur-sm">
        <Container>
          <nav aria-label="Seções do design system" className="flex min-w-max gap-1 py-2">
            {anchors.map(([label, href]) => (
              <a
                className="rounded-sm px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-surface-secondary hover:text-ink"
                key={href}
                href={href}
              >
                {label}
              </a>
            ))}
          </nav>
        </Container>
      </div>
      <Container>
        <BrandFoundation />
        <ControlSections />
        <ProductSections />
        <PatternSections />
      </Container>
    </>
  )
}
