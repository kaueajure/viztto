import { AnimatePresence, motion } from 'motion/react'
import { Check, MoreHorizontal } from 'lucide-react'
import { productDemo } from '@/data/productDemo'
import { StatusBadge, VersionBadge } from '@/components/feedback/FeedbackComponents'
import { AvatarGroup, Breadcrumb } from '@/components/ui/DataDisplay'
import { Button, IconButton } from '@/components/ui/Button'

export function DemoToolbar({
  approved,
  currentVersion,
}: {
  approved: boolean
  currentVersion: 2 | 3
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-3 py-3 sm:px-4">
      <div className="min-w-0">
        <div className="hidden sm:block">
          <Breadcrumb items={[productDemo.project, productDemo.material]} />
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:mt-1.5">
          <h3 className="truncate text-sm font-semibold sm:text-base">{productDemo.material}</h3>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={currentVersion}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <VersionBadge current>{`v${currentVersion}`}</VersionBadge>
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:block">
          <AvatarGroup names={[...productDemo.participants]} />
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={approved ? 'approved' : 'waiting'}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="hidden md:block"
          >
            <StatusBadge status={approved ? 'approved' : 'waiting'} />
          </motion.div>
        </AnimatePresence>
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
