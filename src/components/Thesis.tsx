import { gsap, ScrollTrigger, prefersReducedMotion } from '../lib/gsap'
import { useGsap } from '../hooks/useGsap'
import { SectionLabel } from './SectionLabel'

/**
 * The central proposition, staged as an installation. Three lines
 * arrive at different depths on scrub; one word holds while the rest
 * of the composition moves past it.
 */
export function Thesis() {
  const scope = useGsap<HTMLElement>((_ctx, el) => {
    if (prefersReducedMotion()) {
      gsap.set('.thesis__l, .thesis__tail', { opacity: 1, yPercent: 0, xPercent: 0 })
      return
    }

    gsap.set('.thesis__l', { opacity: 0 })
    gsap.set('.thesis__l--1', { xPercent: -5 })
    gsap.set('.thesis__l--2', { xPercent: 9 })
    gsap.set('.thesis__l--3', { xPercent: -3 })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'top 78%',
        end: 'bottom 62%',
        scrub: 0.9,
      },
    })

    // Different depths: the far line travels furthest, the held word not at all.
    tl.to('.thesis__l--1', { opacity: 1, xPercent: 0, duration: 1 }, 0)
      .to('.thesis__l--2', { opacity: 1, xPercent: 0, duration: 1 }, 0.15)
      .to('.thesis__l--3', { opacity: 1, xPercent: 0, duration: 1 }, 0.3)
      .fromTo(
        '.thesis__hold',
        { scale: 0.94 },
        { scale: 1, duration: 1.4, ease: 'none' },
        0.2,
      )
      .to('.thesis__tail', { opacity: 1, y: 0, duration: 0.8 }, 0.9)

    // Ground warms very slightly as the statement lands.
    ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      end: 'bottom 40%',
      scrub: true,
      animation: gsap.fromTo(
        el,
        // Literal hex, not var(): GSAP cannot parse a custom-property
        // reference as a colour endpoint and falls back to transparent.
        { backgroundColor: '#0a0c0b' },
        { backgroundColor: '#0f1211', ease: 'none' },
      ),
    })
  })

  return (
    <section ref={scope} className="thesis" id="thesis">
      <div className="shell">
        <SectionLabel index="01" title="The proposition" meta="Why this exists" />

        <h2 className="thesis__h display">
          <span className="thesis__l thesis__l--1">We don&rsquo;t</span>
          <span className="thesis__l thesis__l--2">compare plans.</span>
          <span className="thesis__l thesis__l--3">
            We <span className="thesis__hold">keep</span> comparing.
          </span>
        </h2>

        <div className="thesis__tail">
          <p>
            A comparison is a photograph. Australian electricity is a moving
            target: your rate is discounted for twelve months, the discount
            quietly lapses, and the plan that was cheapest the day you signed
            becomes the reason your bill went up.
          </p>
          <p>
            Renewise treats the switch as the beginning. We hold your expiry
            date, re-price the whole market before it arrives, and put the next
            plan in front of you while the old one is still cheap.
          </p>
        </div>
      </div>
    </section>
  )
}
