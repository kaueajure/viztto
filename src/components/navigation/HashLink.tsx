import { useReducedMotion } from 'motion/react'
import { Link, useLocation, useResolvedPath, type LinkProps } from 'react-router-dom'
import { scrollToHash } from '@/lib/scrollToHash'

function isModifiedClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
}

export function HashLink({ to, onClick, target, ...props }: LinkProps) {
  const location = useLocation()
  const resolved = useResolvedPath(to)
  const reduceMotion = Boolean(useReducedMotion())

  return (
    <Link
      {...props}
      to={to}
      target={target}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          !resolved.hash ||
          target === '_blank' ||
          isModifiedClick(event)
        ) {
          return
        }
        if (location.pathname === resolved.pathname && location.hash === resolved.hash) {
          event.preventDefault()
          scrollToHash(resolved.hash, reduceMotion)
        }
      }}
    />
  )
}
