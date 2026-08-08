import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react'
import { useCallback, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { HeroApprovalBadge, HeroWordmark } from './HeroIntroBrand'
import { HeroCheckMark } from './HeroCheckMark'
import {
  HeroCommentCard,
  HeroTimeline,
  HeroVersionBadgeLayer,
} from './HeroCommentLayer'
import { HeroMaterialCard, HeroVersionCard } from './HeroMaterialCard'
import { heroDemo, type HeroStage } from './heroSequence'
import { cn } from '@/lib/cn'

const spring = { stiffness: 160, damping: 24, mass: 0.65 }

function useFinePointerDesktop() {
  const [enabled, setEnabled] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (pointer: fine)')
    const sync = () => setEnabled(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])
  return enabled
}

export function HeroProductScene({ stage }: { stage: HeroStage }) {
  const prefersReducedMotion = Boolean(useReducedMotion())
  const tiltEnabled = useFinePointerDesktop() && !prefersReducedMotion && stage === 'live'
  const [pinActive, setPinActive] = useState(false)
  const [approvalHover, setApprovalHover] = useState(false)
  const [versionHover, setVersionHover] = useState<'v1' | 'v2' | null>(null)

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const tiltX = useSpring(useTransform(pointerY, [-0.5, 0.5], [2, -2]), spring)
  const tiltY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-3, 3]), spring)

  const introMark = stage === 'check' || stage === 'brand'
  const showBrand = stage === 'brand'
  const sceneReady =
    stage === 'transform' || stage === 'expand' || stage === 'copy' || stage === 'live'
  const layersReady = stage === 'expand' || stage === 'copy' || stage === 'live'
  const pulledBack = stage === 'expand' || stage === 'copy' || stage === 'live'
  const live = stage === 'live'

  const resetTilt = useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  useEffect(() => {
    if (!tiltEnabled) resetTilt()
  }, [resetTilt, tiltEnabled])

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <div
      id="demonstracao"
      className="relative mx-auto flex min-h-[22rem] w-full max-w-[34rem] items-center justify-center px-1 sm:min-h-[26rem] sm:px-2 lg:mx-0 lg:min-h-[28rem] lg:max-w-none lg:px-0 xl:min-h-[30rem]"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 grid place-items-center"
        animate={{ opacity: introMark ? 1 : 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
      >
        <div className="flex flex-col items-center gap-4">
          {introMark ? (
            <HeroCheckMark
              layoutId="viztto-hero-check"
              draw={stage === 'check'}
              reducedMotion={prefersReducedMotion}
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          ) : null}
          <HeroWordmark visible={showBrand} reducedMotion={prefersReducedMotion} />
        </div>
      </motion.div>

      <motion.div
        className="relative w-full lg:[perspective:1200px]"
        animate={prefersReducedMotion || !live ? undefined : { y: [0, -5, 0] }}
        transition={
          prefersReducedMotion || !live
            ? undefined
            : { duration: 7, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        <motion.div
          className="relative origin-center"
          animate={{
            opacity: sceneReady ? 1 : 0,
            scale: pulledBack ? 1 : sceneReady ? 1.14 : 0.9,
            y: pulledBack ? 0 : sceneReady ? 10 : 28,
            rotateX: prefersReducedMotion || pulledBack ? 0 : sceneReady ? 5 : 9,
            rotateY: prefersReducedMotion || pulledBack ? 0 : sceneReady ? -4 : -7,
          }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="relative"
            style={
              tiltEnabled
                ? {
                    rotateX: tiltX,
                    rotateY: tiltY,
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                  }
                : { transformStyle: 'preserve-3d' }
            }
            onPointerMove={onPointerMove}
            onPointerLeave={resetTilt}
            onPointerCancel={resetTilt}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ transform: 'translateZ(-48px)' }}
            >
              <div className="absolute left-1/2 top-1/2 h-[70%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.1] blur-[88px]" />
            </div>

            <div
              className="pointer-events-none absolute inset-0 hidden lg:block"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <motion.div
                className="absolute left-0 top-[18%] pointer-events-auto"
                style={{ transform: 'translate3d(0,0,-70px) rotateY(14deg)' }}
                animate={{ opacity: layersReady ? 0.78 : 0, x: layersReady ? 0 : -16 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.34 }}
                onHoverStart={() => setVersionHover('v1')}
                onHoverEnd={() => setVersionHover(null)}
              >
                <HeroVersionCard version="V1" label="Anterior" advanced={versionHover === 'v1'} />
              </motion.div>
              <motion.div
                className="absolute bottom-[14%] left-[6%] pointer-events-auto"
                style={{ transform: 'translate3d(0,0,-42px) rotateY(10deg)' }}
                animate={{ opacity: layersReady ? 0.9 : 0, x: layersReady ? 0 : -12 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.34,
                  delay: prefersReducedMotion ? 0 : 0.05,
                }}
                onHoverStart={() => setVersionHover('v2')}
                onHoverEnd={() => setVersionHover(null)}
              >
                <HeroVersionCard version="V2" label="Revisão" advanced={versionHover === 'v2'} />
              </motion.div>
            </div>

            <div
              className="relative mx-auto w-[min(100%,22rem)] sm:w-[min(100%,26rem)] lg:ml-auto lg:mr-6 lg:w-[min(100%,27rem)] xl:mr-10"
              style={{ transform: 'translateZ(0)' }}
            >
              <HeroVersionBadgeLayer visible={layersReady} reducedMotion={prefersReducedMotion} />
              <HeroMaterialCard pinActive={pinActive} />
              <HeroCommentCard
                visible={layersReady}
                reducedMotion={prefersReducedMotion}
                highlighted={pinActive}
                onHoverChange={setPinActive}
              />
              <motion.div
                className="pointer-events-auto absolute -bottom-3 left-3 z-20 sm:left-4"
                style={{ transform: 'translateZ(44px)' }}
                onHoverStart={() => setApprovalHover(true)}
                onHoverEnd={() => setApprovalHover(false)}
              >
                <HeroApprovalBadge
                  active={sceneReady}
                  reducedMotion={prefersReducedMotion}
                  showSharedCheck={!introMark && sceneReady}
                  emphasize={approvalHover}
                />
              </motion.div>
            </div>

            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 right-1 hidden rounded-md border border-line bg-surface px-2.5 py-2 shadow-soft lg:block"
              style={{ transform: 'translateZ(36px)' }}
              animate={{ opacity: layersReady ? 1 : 0, y: layersReady ? 0 : 8 }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.28,
                delay: prefersReducedMotion ? 0 : 0.08,
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Cliente
              </p>
              <p className="mt-0.5 text-xs font-semibold text-ink">{heroDemo.author}</p>
              <p className="mt-0.5 text-[10px] text-approval">✓ {heroDemo.clientNote}</p>
            </motion.div>
          </motion.div>
        </motion.div>

        <HeroTimeline visible={layersReady} reducedMotion={prefersReducedMotion} />
      </motion.div>

      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute bottom-6 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-full bg-black/35 blur-2xl transition-opacity duration-500',
          sceneReady ? 'opacity-100' : 'opacity-0',
        )}
      />
    </div>
  )
}
