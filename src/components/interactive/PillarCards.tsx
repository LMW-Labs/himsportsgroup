import { useEffect, useRef, useState } from 'react'

const pillars = [
  {
    number: '01',
    eyebrow: '01 · FOR ATHLETES',
    headline: 'WE REPRESENT THE NEXT GENERATION',
    body: "From NIL deals to pro contracts, we build careers from the ground up — with personal attention that 200-person agencies can't match.",
    cta: 'Our Roster →',
    href: '/athletes',
  },
  {
    number: '02',
    eyebrow: '02 · FOR BRANDS',
    headline: 'CONNECT YOUR BRAND TO CULTURE',
    body: 'We connect forward-thinking brands with the athletes your audience already follows. NIL deals to full campaign management.',
    cta: 'For Brands →',
    href: '/brands',
  },
  {
    number: '03',
    eyebrow: '03 · THE AGENCY',
    headline: 'BUILT BY A GLOBETROTTER',
    body: "Our founder performed on 6 continents for millions of fans. That global stage, that showmanship — it's in every deal we negotiate.",
    cta: 'Our Story →',
    href: '/about',
  },
]

function PillarCard({ pillar, index }: { pillar: typeof pillars[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { rootMargin: '-80px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="pillar-card"
      style={{
        backgroundColor: '#0E1220',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 0 rgba(216,232,244,0.08), 0 0 0 1px rgba(168,189,208,0.10), 0 4px 24px rgba(0,0,0,0.5)',
        transition: 'box-shadow 250ms, transform 250ms, opacity 550ms, translate 550ms',
        opacity: visible ? 1 : 0,
        translate: visible ? '0 0' : `0 32px`,
        transitionDelay: `${index * 100}ms`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'inset 0 1px 0 rgba(216,232,244,0.15), 0 0 0 1px rgba(200,80,16,0.35), 0 0 40px rgba(200,80,16,0.12), 0 8px 32px rgba(0,0,0,0.7)'
        el.style.transform = 'translateY(-4px)'
        const bar = el.querySelector('.accent-bar') as HTMLElement
        if (bar) bar.style.transform = 'scaleX(1)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'inset 0 1px 0 rgba(216,232,244,0.08), 0 0 0 1px rgba(168,189,208,0.10), 0 4px 24px rgba(0,0,0,0.5)'
        el.style.transform = 'translateY(0)'
        const bar = el.querySelector('.accent-bar') as HTMLElement
        if (bar) bar.style.transform = 'scaleX(0)'
      }}
    >
      {/* Decorative number */}
      <span style={{
        position: 'absolute', top: '16px', right: '24px',
        fontFamily: "'Bebas Neue', sans-serif", fontSize: '6rem', lineHeight: 1,
        color: 'rgba(26,114,232,0.05)', pointerEvents: 'none', userSelect: 'none',
      }}>
        {pillar.number}
      </span>

      {/* Eyebrow */}
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#C85010', letterSpacing: '0.3em', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '16px' }}>
        {pillar.eyebrow}
      </p>

      {/* Headline */}
      <h3 style={{
        fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.25rem', lineHeight: 1.1, marginBottom: '20px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
      }}>
        {pillar.headline}
      </h3>

      {/* Body */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', lineHeight: 1.65, color: '#A8BDD0', marginBottom: '32px' }}>
        {pillar.body}
      </p>

      {/* CTA */}
      <a
        href={pillar.href}
        style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, color: '#1A72E8', fontSize: '0.9rem', letterSpacing: '0.06em', textDecoration: 'none', transition: 'color 200ms' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D8E8F4' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#1A72E8' }}
      >
        {pillar.cta}
      </a>

      {/* Bottom accent bar */}
      <span className="accent-bar" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
        backgroundColor: '#C85010', transformOrigin: 'left',
        transform: 'scaleX(0)', transition: 'transform 300ms ease-out',
      }} />
    </div>
  )
}

export default function PillarCards() {
  return (
    <>
      <style>{`
        .pillars-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 768px) { .pillars-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
      <section style={{ padding: '96px 0', backgroundColor: '#0A0C10', borderTop: '1px solid rgba(168,189,208,0.1)' }}>
        <div style={{ maxWidth: '1344px', margin: '0 auto', padding: '0 clamp(24px, 4vw, 32px)' }}>
          <div className="pillars-grid">
            {pillars.map((pillar, index) => (
              <PillarCard key={pillar.number} pillar={pillar} index={index} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
