import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { commercialLinks } from './navigationData'
import { LinkButton } from '@/components/ui/Button'
import { HashLink } from './HashLink'

type MobileNavigationProps = {
  open: boolean
  onClose: (returnFocus?: boolean) => void
}

export function MobileNavigation({ open, onClose }: MobileNavigationProps) {
  const reduceMotion = useReducedMotion()
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-navigation"
          className="fixed inset-x-0 bottom-0 top-16 z-40 bg-overlay md:hidden"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
            className="flex max-h-full min-h-[min(520px,calc(100dvh-64px))] flex-col border-t border-line bg-background px-5 pb-6 pt-5 shadow-raised"
          >
            <nav aria-label="Navegação mobile" className="grid">
              {commercialLinks.map((link, index) => {
                const className =
                  'group flex min-h-14 items-center justify-between border-b border-line-subtle text-lg font-semibold'
                const conteudo = (
                  <>
                    {link.label}
                    <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-brand" />
                  </>
                )
                return (
                  <motion.div
                    key={link.to}
                    initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.04 + index * 0.035,
                      duration: reduceMotion ? 0 : 0.18,
                    }}
                  >
                    {link.to.includes('#') ? (
                      <HashLink to={link.to} onClick={() => onClose(false)} className={className}>
                        {conteudo}
                      </HashLink>
                    ) : (
                      <Link to={link.to} onClick={() => onClose(false)} className={className}>
                        {conteudo}
                      </Link>
                    )}
                  </motion.div>
                )
              })}
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
