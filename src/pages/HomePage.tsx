import { HeroSection } from '@/sections/home/HeroSection'
import { SupportedFormatsSection } from '@/sections/home/SupportedFormatsSection'
import { ProblemSection } from '@/sections/home/ProblemSection'
import { TransformationSection } from '@/sections/home/TransformationSection'
import { OutcomeSection } from '@/sections/home/OutcomeSection'
import { HowItWorksSection } from '@/sections/home/HowItWorksSection'
import { useEffect } from 'react'
import { useReducedMotion } from 'motion/react'
import { useLocation } from 'react-router'
import { AudienceSection } from '@/sections/home/AudienceSection'
import { FeaturesSection } from '@/sections/home/FeaturesSection'
import { VersionComparisonSection } from '@/sections/home/VersionComparisonSection'
import { ClientExperienceSection } from '@/sections/home/ClientExperienceSection'
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
      <SupportedFormatsSection />
      <ProblemSection />
      <TransformationSection />
      <OutcomeSection />
      <HowItWorksSection />
      <AudienceSection />
      <FeaturesSection />
      <VersionComparisonSection />
      <ClientExperienceSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
    </>
  )
}
