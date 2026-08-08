import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { ProblemFeedbackScene } from '@/components/problem-demo/ProblemFeedbackScene'

export function ProblemSection() {
  return (
    <Section
      id="problema"
      aria-labelledby="problem-title"
      className="scroll-mt-24 pb-8 pt-20 md:pb-10 md:pt-28"
    >
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-brand">O problema não é o feedback</p>
            <h2 id="problem-title" className="heading-lg mt-4 max-w-4xl">
              O feedback está em todo lugar.
              <br />
              <span className="relative font-serif font-normal italic text-revision">
                Menos onde deveria estar.
                <span
                  aria-hidden="true"
                  className="absolute -bottom-2 left-1 h-0.5 w-24 -rotate-1 bg-revision/70"
                />
              </span>
            </h2>
            <p className="body-lg mt-6 max-w-xl">
              Mensagens, áudios, e-mails e arquivos duplicados fazem sua equipe perder tempo tentando
              descobrir qual alteração pertence a qual versão.
            </p>
          </div>
          <div className="lg:col-span-7">
            <ProblemFeedbackScene />
          </div>
        </div>
      </Container>
    </Section>
  )
}
