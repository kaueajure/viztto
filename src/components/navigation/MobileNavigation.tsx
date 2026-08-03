import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { commercialLinks } from './navigationData'
import { LinkButton } from '@/components/ui/Button'

type MobileNavigationProps = {
  open: boolean
  onClose: (returnFocus?: boolean) => void
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-overlay md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="flex max-h-full min-h-[min(520px,calc(100dvh-64px))] flex-col border-t border-line bg-background px-5 pb-6 pt-5 shadow-raised"
          >
            <nav aria-label="Navegação mobile" className="grid">
              {commercialLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + index * 0.035, duration: 0.18 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => onClose(false)}
                    className="group flex min-h-14 items-center justify-between border-b border-line-subtle text-lg font-semibold"
                  >
                    {link.label}
                    <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-brand" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="mt-auto grid gap-3 pt-8 sm:grid-cols-2">
              <LinkButton to="/entrar" variant="outline" onClick={() => onClose(false)}>
                Entrar
              </LinkButton>
              <LinkButton to="/criar-conta" onClick={() => onClose(false)}>
                Começar grátis <ArrowUpRight className="h-4 w-4" />
              </LinkButton>
            </div>
            <p className="mt-5 text-center text-xs text-muted">
              Clientes podem revisar sem criar conta.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
