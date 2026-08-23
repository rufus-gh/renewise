import { Mark } from './Preloader'

const COLUMNS = [
  {
    title: 'Product',
    links: ['How it works', 'Pricing', 'The benefit clock', 'Solar & battery'],
  },
  {
    title: 'Company',
    links: ['About', 'How we are paid', 'Careers', 'Press'],
  },
  {
    title: 'Legal',
    links: ['Terms', 'Privacy', 'CDR policy', 'Complaints'],
  },
]

export function Footer() {
  return (
    <footer className="foot">
      <div className="shell foot__inner">
        <div className="foot__brand">
          <a href="#top" className="foot__mark" data-cursor="explore">
            <Mark size={15} />
            <span>Renewise</span>
          </a>
          <p className="foot__line">
            Electricity today. Gas, internet and insurance are the same problem
            wearing different clothes.
          </p>
          <p className="foot__soon mono">Gas — 2027 · Internet — 2027 · Insurance — later</p>
        </div>

        <nav className="foot__cols" aria-label="Footer">
          {COLUMNS.map((c) => (
            <div className="foot__col" key={c.title}>
              <h3 className="mono">{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#top" data-cursor="explore">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="foot__col">
            <h3 className="mono">Contact</h3>
            <ul>
              <li>
                <a href="mailto:hello@renewise.com.au" data-cursor="open">
                  hello@renewise.com.au
                </a>
              </li>
              <li>
                <a href="#top" data-cursor="open">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href="#top" data-cursor="open">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="shell foot__base">
        <span className="mono">© 2026 Renewise Pty Ltd · ABN 00 000 000 000</span>
        <span className="mono">Plan index v2026.08.23 · 4,113 offers · Built in Sydney</span>
      </div>
    </footer>
  )
}
