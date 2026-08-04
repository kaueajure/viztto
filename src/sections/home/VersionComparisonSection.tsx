import { VersionComparison } from '@/components/features/VersionComparison'
import { Container } from '@/components/layout/Container'

export function VersionComparisonSection() {
  return (
    <section
      aria-labelledby="comparison-title"
      className="border-y border-line-subtle bg-surface-secondary/35 py-20 md:py-28"
    >
      <Container>
        <div className="grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <p className="eyebrow">Comparação sem adivinhação</p>
            <h2 id="comparison-title" className="heading-lg mt-4">
              Veja exatamente{' '}
              <span className="font-serif font-normal text-accent">o que mudou.</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-secondary">
              Compare duas versões lado a lado ou arraste o divisor para identificar alterações sem
              alternar entre arquivos.
            </p>
            <div className="mt-8 hidden h-px w-32 bg-brand lg:block" aria-hidden />
          </div>
          <VersionComparison />
        </div>
      </Container>
    </section>
  )
}
