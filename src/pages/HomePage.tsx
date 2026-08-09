import { HeroSection } from '@/sections/home/HeroSection'
import { ProblemSection } from '@/sections/home/ProblemSection'
import { OutcomeSection } from '@/sections/home/OutcomeSection'
import { HowItWorksSection } from '@/sections/home/HowItWorksSection'
import { FeaturesSection } from '@/sections/home/FeaturesSection'
import { ClientExperienceSection } from '@/sections/home/ClientExperienceSection'
import { useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router'
import { PricingSection } from '@/sections/home/PricingSection'
import { FaqSection } from '@/sections/home/FaqSection'
import { FinalCtaSection } from '@/sections/home/FinalCtaSection'
import { scrollToHash } from '@/lib/scrollToHash'

export default function HomePage() {
  const location = useLocation()
  const prefersReducedMotion = Boolean(useReducedMotion())

  useEffect(() => {
    if (!location.hash) return
    scrollToHash(location.hash, prefersReducedMotion)
  }, [location.hash, prefersReducedMotion])

  return (
    <>
      <HeroSection />
      <ProblemSection />
      <OutcomeSection />
      <HowItWorksSection />
      <FeaturesSection />
      <ClientExperienceSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  )
}
