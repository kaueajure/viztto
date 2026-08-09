import { LoaderCircle } from 'lucide-react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { forwardRef, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { HashLink } from '@/components/navigation/HashLink'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-contrast border-brand hover:bg-brand-hover active:bg-brand-active hover:shadow-soft',
  secondary:
    'bg-surface-elevated text-ink border-line hover:border-line-strong hover:bg-surface-secondary',
  outline:
    'bg-transparent text-ink border-line-strong hover:border-brand hover:bg-surface-secondary',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-secondary',
  destructive: 'bg-revision text-background border-revision hover:bg-revision-hover',
  link: 'bg-transparent text-brand border-transparent px-1 hover:text-brand-hover underline-offset-4 hover:underline',
}

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant
  loading?: boolean
  icon?: ReactNode
}
export function Button({
  variant = 'primary',
  loading,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ duration: reduceMotion ? 0 : 0.16 }}
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors disabled:opacity-45',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {children as ReactNode}
    </motion.button>
  )
}

export const IconButton = forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<'button'> & { label: string }
>(function IconButton({ label, children, className, ...props }, ref) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.button
      ref={ref}
      whileTap={reduceMotion ? undefined : { scale: 0.94 }}
      aria-label={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-surface transition-colors hover:border-line-strong hover:bg-surface-secondary',
        className,
      )}
      {...props}
    >
      {children as ReactNode}
    </motion.button>
  )
})

export function LinkButton({
  variant = 'primary',
  className,
  children,
  ...props
}: LinkProps & { variant?: Variant }) {
  const Component = typeof props.to === 'string' && props.to.includes('#') ? HashLink : Link
  return (
    <Component
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
