import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SplitLines } from './SplitLines'

/**
 * The breathing point. Almost no interface, one statement, and the
 * slowest motion on the site — a very long, very small drift so the
 * section feels like it is settling rather than arriving.
 */
export function Philosophy() {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    if (prefersReducedMotion()) return
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 2.4,
      animation: gsap.fromTo(
        el.querySelector('.phil__h'),
        { yPercent: 6 },
        { yPercent: -6, ease: 'none' },
      ),
    })
  })

  return (
    <section ref={scope} className="phil">
      <div className="shell phil__inner">
        <p className="phil__eyebrow mono">The Advantage</p>

        <SplitLines
          as="h2"
          className="phil__h display"
          lines={['The best rate,', 'always.', 'Without having', 'to check.']}
          stagger={0.11}
        />

        <p className="phil__b">
          Australian households overpay by hundreds of dollars each year when initial
          discounts quietly lapse. Renewise continuously monitors your plan, calculates
          every offer on the market against your real consumption profile, and switches you
          before higher rates kick in.
        </p>
      </div>
    </section>
  )
}
