import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { outcomes } from '@/data/problemDemo'

export function OutcomeSection() {
  return (
    <Section aria-labelledby="outcome-title" className="border-y border-line-subtle bg-surface/35">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-approval">Depois de centralizar</p>
            <h2 id="outcome-title" className="heading-md mt-4">
              Cada comentário no contexto certo.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-secondary">
              O Viztto conecta feedback, material, versão e responsável para que sua equipe saiba
              exatamente o que precisa ser alterado.
            </p>
          </div>
          <ol className="lg:col-span-7">
            {outcomes.map((outcome, index) => (
              <li
                key={outcome.title}
                className="grid gap-3 border-t border-line py-5 sm:grid-cols-[56px_1fr_1.2fr] sm:items-start"
              >
                <span className="font-mono text-xs text-brand">0{index + 1}</span>
                <h3 className="font-semibold">{outcome.title}</h3>
                <p className="text-sm leading-relaxed text-secondary">{outcome.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  )
}
