import { useLayoutEffect, useRef, type RefObject } from 'react'
import { gsap } from '../lib/gsap'

/**
 * Scopes a GSAP context to a ref and reverts it on unmount, so every
 * tween and ScrollTrigger created inside is cleaned up automatically.
 * `deps` is intentionally shallow — animation setup should not depend
 * on values that change during scroll.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  setup: (ctx: gsap.Context, scope: T) => void,
  deps: unknown[] = [],
): RefObject<T | null> {
  const scope = useRef<T | null>(null)

  useLayoutEffect(() => {
    if (!scope.current) return
    const el = scope.current
    const ctx = gsap.context((self) => setup(self, el), el)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return scope
}
