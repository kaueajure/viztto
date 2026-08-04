import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

export function useActiveSection(ids: readonly string[]) {
  const { pathname } = useLocation()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (pathname !== '/') {
      setActiveId(null)
      return
    }
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        })
        const next = [...visible.entries()]
          .filter(([, ratio]) => ratio > 0)
          .sort((a, b) => b[1] - a[1])[0]?.[0]
        setActiveId(next ?? null)
      },
      { rootMargin: '-72px 0px -62% 0px', threshold: [0, 0.04, 0.08, 0.12] },
    )
    const observed = new Set<string>()
    const observeAvailableSections = () => {
      ids.forEach((id) => {
        const element = document.getElementById(id)
        if (element && !observed.has(id)) {
          observed.add(id)
          observer.observe(element)
        }
      })
      if (observed.size === ids.length) mutationObserver.disconnect()
    }
    const mutationObserver = new MutationObserver(observeAvailableSections)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    observeAvailableSections()
    return () => {
      mutationObserver.disconnect()
      observer.disconnect()
    }
  }, [ids, pathname])

  return activeId
}
