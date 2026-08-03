import {
  FileImage,
  FileText,
  Film,
  GalleryHorizontalEnd,
  LayoutTemplate,
  PanelsTopLeft,
  Presentation,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Container } from '@/components/layout/Container'
import { supportedFormats } from '@/data/problemDemo'

const icons = [
  FileImage,
  Film,
  GalleryHorizontalEnd,
  FileText,
  Presentation,
  PanelsTopLeft,
  LayoutTemplate,
]

export function SupportedFormatsSection() {
  const reducedMotion = Boolean(useReducedMotion())
  return (
    <section aria-label="Formatos suportados" className="border-b border-line bg-surface/45 py-5">
      <Container className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="shrink-0 text-sm font-semibold">Revise tudo em um único fluxo</p>
        <motion.ul
          initial={reducedMotion ? false : { opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          className="flex gap-x-5 gap-y-3 overflow-x-auto pb-1 text-xs text-secondary lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0"
        >
          {supportedFormats.map((format, index) => {
            const Icon = icons[index]
            return (
              <li key={format} className="inline-flex shrink-0 items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-brand" />
                {format}
              </li>
            )
          })}
        </motion.ul>
      </Container>
    </section>
  )
}
