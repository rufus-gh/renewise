import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

/* One place to state the site's motion personalities, so a timeline
   never has to invent an ease. */
export const EASE = {
  ui: 'power3.out',
  type: 'expo.out',
  mass: 'power2.inOut',
  cinematic: 'power4.inOut',
  settle: 'elastic.out(1, 0.72)',
} as const

export const DUR = {
  micro: 0.22,
  ui: 0.42,
  type: 0.9,
  mass: 1.4,
  scene: 1.8,
} as const

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function isTouch(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0)
  )
}

/**
 * Whether an entrance animation should play at all. A hidden tab stops
 * rAF, so a timeline started there never runs — and anything it was
 * meant to reveal would stay invisible until GSAP next ticks. In that
 * case the end state is simply applied.
 */
export function shouldAnimate(): boolean {
  return !prefersReducedMotion() && !(typeof document !== 'undefined' && document.hidden)
}

/* Coarse breakpoint used to swap pinned scenes for static ones. */
export function isCompact(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < 900
}

/* Dev-only handle so scroll scenes can be driven from the console while
   art-directing. Stripped from production builds. */
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).__gsap = gsap
  ;(window as unknown as Record<string, unknown>).__ST = ScrollTrigger
}

export { gsap, ScrollTrigger, MotionPathPlugin }
