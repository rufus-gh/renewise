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
        <p className="phil__eyebrow mono">Position</p>

        <SplitLines
          as="h2"
          className="phil__h display"
          lines={['We are paid', 'by you.', 'Everything else', 'follows from that.']}
          stagger={0.11}
        />

        <p className="phil__b">
          Every comparison service in this country is paid by the retailers it
          recommends. One of them was fined $8.5&nbsp;million for letting that
          shape the ranking. We took the other option: a few dollars a month from
          you, and nothing at all from anyone else.
        </p>
      </div>
    </section>
  )
}
