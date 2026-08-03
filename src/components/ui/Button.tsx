import { LoaderCircle } from 'lucide-react'
import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white border-brand hover:bg-brand-hover',
  secondary: 'bg-ink text-white border-ink hover:bg-ink/85',
  outline: 'bg-transparent text-ink border-line-strong hover:bg-surface',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-secondary',
  destructive: 'bg-revision text-white border-revision hover:bg-revision-dark',
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
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.16 }}
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

export function IconButton({
  label,
  children,
  className,
  ...props
}: HTMLMotionProps<'button'> & { label: string }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      aria-label={label}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-md border border-line bg-surface transition-colors hover:bg-surface-secondary',
        className,
      )}
      {...props}
    >
      {children as ReactNode}
    </motion.button>
  )
}

export function LinkButton({
  variant = 'primary',
  className,
  children,
  ...props
}: LinkProps & { variant?: Variant }) {
  return (
    <Link
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold transition-colors',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
