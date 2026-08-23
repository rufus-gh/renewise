import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { MagneticButton } from './MagneticButton'
import { SplitLines } from './SplitLines'

interface Props {
  onStart: () => void
}

/**
 * The conclusion. A clip-path wipe brings the panel up as the section
 * enters, so the transition into the footer reads as one continuous
 * movement rather than a new block appearing.
 */
export function CTA({ onStart }: Props) {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    if (prefersReducedMotion()) {
      gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' })
      // The button lives behind an opacity-0 rule, so it has to be
      // revealed here too — otherwise the primary action disappears.
      gsap.set('.cta__side > *', { opacity: 1, y: 0 })
      return
    }
    gsap.fromTo(
      el,
      { clipPath: 'inset(22% 6% 0% 6%)' },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 92%', end: 'top 34%', scrub: 0.8 },
      },
    )

    ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      once: true,
      onEnter: () =>
        gsap.to('.cta__side > *', {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.35,
        }),
    })
  })

  return (
    <section ref={scope} className="cta">
      <div className="shell cta__inner">
        <SplitLines
          as="h2"
          className="cta__h display"
          lines={['Ready to', 'stop thinking', 'about it?']}
          stagger={0.09}
        />

        <div className="cta__side">
          <p>
            Ninety seconds, four questions, and a number you can check against
            your last bill. No card, no call, no one from a contact centre.
          </p>
          <MagneticButton onClick={onStart} pull={20} cursor="open" cursorLabel="BEGIN">
            Find my plan
          </MagneticButton>
          <p className="cta__fine mono">
            Free to compare · $4.99/mo to keep watching · Cancel any time
          </p>
        </div>
      </div>
    </section>
  )
}
