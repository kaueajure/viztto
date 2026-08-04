import { CalendarCheck2, GitCompareArrows } from 'lucide-react'
import { ImageReviewDemo } from '@/components/features/ImageReviewDemo'
import { VideoReviewDemo } from '@/components/features/VideoReviewDemo'
import { ApprovalStamp, HistoryLine, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { Container } from '@/components/layout/Container'
import { mainFeatures } from '@/data/features'

export function FeaturesSection() {
  return (
    <section
      id="recursos"
      aria-labelledby="features-title"
      className="scroll-mt-24 border-t border-line-subtle py-20 md:py-28"
    >
      <Container>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-end">
          <div>
            <p className="eyebrow">Tudo que a revisão precisa</p>
            <h2 id="features-title" className="heading-lg mt-4">
              Feedback claro em{' '}
              <span className="font-serif font-normal text-brand">qualquer formato.</span>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-relaxed text-secondary lg:justify-self-end">
            Centralize comentários, versões e decisões sem obrigar sua equipe a adaptar o processo a
            ferramentas diferentes.
          </p>
        </div>

        <article className="mt-14 grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <span className="font-serif text-2xl text-brand">01</span>
            <h3 className="heading-md mt-4">{mainFeatures[0].title}</h3>
            <p className="mt-4 leading-relaxed text-secondary">{mainFeatures[0].description}</p>
            <p className="mt-5 text-sm text-muted">Imagens · PDFs · apresentações</p>
          </div>
          <ImageReviewDemo />
        </article>

        <article className="mt-20 grid gap-7 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div className="lg:order-2">
            <span className="font-serif text-2xl text-revision">02</span>
            <h3 className="heading-md mt-4">{mainFeatures[1].title}</h3>
            <p className="mt-4 leading-relaxed text-secondary">{mainFeatures[1].description}</p>
            <p className="mt-5 text-sm text-muted">Timestamp · cenas · versões de vídeo</p>
          </div>
          <VideoReviewDemo />
        </article>

        <div className="mt-20 grid overflow-hidden rounded-xl border border-line bg-surface lg:grid-cols-2">
          <article className="p-6 sm:p-8 lg:border-r lg:border-line">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-accent-soft text-accent">
                <GitCompareArrows className="h-5 w-5" />
              </span>
              <span className="font-serif text-2xl text-accent">03</span>
            </div>
            <h3 className="heading-md mt-8">{mainFeatures[2].title}</h3>
            <p className="mt-4 max-w-xl leading-relaxed text-secondary">
              {mainFeatures[2].description}
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <VersionBadge>v1</VersionBadge>
              <VersionBadge>v2</VersionBadge>
              <VersionBadge approved>v3 aprovada</VersionBadge>
              <VersionBadge current>v4 atual</VersionBadge>
            </div>
          </article>
          <article className="border-t border-line p-6 sm:p-8 lg:border-t-0">
            <div className="flex items-center justify-between">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-approval-soft text-approval">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <span className="font-serif text-2xl text-approval">04</span>
            </div>
            <h3 className="heading-md mt-8">{mainFeatures[3].title}</h3>
            <p className="mt-4 max-w-xl leading-relaxed text-secondary">
              {mainFeatures[3].description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <ApprovalStamp />
              <div className="max-h-28 overflow-hidden">
                <HistoryLine />
              </div>
            </div>
          </article>
        </div>
      </Container>
    </section>
  )
}
