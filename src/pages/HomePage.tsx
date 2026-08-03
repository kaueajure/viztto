import { HeroSection } from '@/sections/home/HeroSection'
import { SupportedFormatsSection } from '@/sections/home/SupportedFormatsSection'
import { ProblemSection } from '@/sections/home/ProblemSection'
import { TransformationSection } from '@/sections/home/TransformationSection'
import { OutcomeSection } from '@/sections/home/OutcomeSection'
import { HowItWorksSection } from '@/sections/home/HowItWorksSection'
import { useEffect } from 'react'
import { AudienceSection } from '@/sections/home/AudienceSection'

export default function HomePage() {
  useEffect(() => {
    const scrollToHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id) return

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document.getElementById(id)?.scrollIntoView({ block: 'start' })
        })
      })
    }

    scrollToHash()
    window.addEventListener('hashchange', scrollToHash)
    return () => window.removeEventListener('hashchange', scrollToHash)
  }, [])

  return (
    <>
      <HeroSection />
      <SupportedFormatsSection />
      <ProblemSection />
      <TransformationSection />
      <OutcomeSection />
      <HowItWorksSection />
      <AudienceSection />
    </>
  )
}
