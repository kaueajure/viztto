import { motion } from 'motion/react'
import { Check, MoreHorizontal } from 'lucide-react'
import { productDemo, type DemoPhase } from '@/data/productDemo'
import { StatusBadge, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { AvatarGroup, Breadcrumb } from '@/components/ui/DataDisplay'
import { Button, IconButton } from '@/components/ui/Button'

export function DemoToolbar({
  phase,
  reducedMotion,
}: {
  phase: DemoPhase
  reducedMotion: boolean
}) {
  const approved = phase === 'approved'
  const currentVersion = phase === 'new-version' || approved ? 3 : 2
  const versionChanged = phase === 'new-version'

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-3 py-3 sm:px-4">
      <div className="min-w-0">
        <div className="hidden sm:block">
          <Breadcrumb items={[productDemo.project, productDemo.material]} />
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:mt-1.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{productDemo.material}</h3>
          <motion.span
            animate={{ opacity: phase === 'resetting' ? 0.5 : 1, y: versionChanged ? [4, 0] : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <VersionBadge current>{`v${currentVersion}`}</VersionBadge>
          </motion.span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <AvatarGroup names={[...productDemo.participants]} />
        </div>
        <motion.div
          animate={{ opacity: phase === 'resetting' ? 0.45 : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
          className="hidden md:block"
        >
          <StatusBadge status={approved ? 'approved' : 'waiting'} />
        </motion.div>
        <Button
          variant={approved ? 'outline' : 'primary'}
          icon={<Check className="h-3.5 w-3.5" />}
          className="min-h-9 px-3 text-xs"
          aria-label={approved ? 'Versão aprovada' : 'Aprovar versão'}
        >
          <span className="hidden sm:inline">{approved ? 'Aprovada' : 'Aprovar versão'}</span>
        </Button>
        <IconButton label="Mais opções" className="h-9 w-9">
          <MoreHorizontal className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  )
}
