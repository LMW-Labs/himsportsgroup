import { useEffect, useRef, useState } from 'react'

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="4" ry="10" />
    <path d="M2 12h20" /><path d="M2 7c2.5 1.5 5 2 10 2s7.5-.5 10-2" />
    <path d="M2 17c2.5-1.5 5-2 10-2s7.5.5 10 2" />
  </svg>
)
const DocumentIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 7h8" /><path d="M8 11h8" /><path d="M8 15h5" />
  </svg>
)
const LayersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="14" width="20" height="4" rx="1" /><rect x="2" y="9" width="20" height="4" rx="1" /><rect x="2" y="4" width="20" height="4" rx="1" />
  </svg>
)
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 3l-2 4H10L8 3" /><circle cx="12" cy="14" r="3" />
  </svg>
)
const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="12" width="4" height="9" /><rect x="10" y="6" width="4" height="15" /><rect x="17" y="9" width="4" height="12" />
    <path d="M2 21h20" />
  </svg>
)
const ArrowUpIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" /><path d="M5 12l7-7 7 7" /><path d="M5 19h14" />
  </svg>
)

const services = [
  { number: '01', icon: <GlobeIcon />,    title: 'NIL Deal Negotiation',        description: 'We identify, structure, and negotiate NIL agreements that protect your rights, maximize your value, and position your brand for long-term growth.' },
  { number: '02', icon: <DocumentIcon />, title: 'Contract Representation',     description: 'From first professional contract to multi-year extensions, we advocate for every clause — compensation, performance bonuses, and exit terms.' },
  { number: '03', icon: <LayersIcon />,   title: 'Brand Architecture',          description: 'We build athlete brands from the ground up — defining your identity, voice, and market positioning to command premium partnerships.' },
  { number: '04', icon: <CameraIcon />,   title: 'Media Training',              description: 'On-camera coaching, press prep, and interview strategy so every public appearance adds to your brand — never detracts from it.' },
  { number: '05', icon: <ChartIcon />,    title: 'Financial Literacy & Planning', description: 'We connect athletes with trusted advisors and arm them with the knowledge to protect earnings, build wealth, and plan beyond the game.' },
  { number: '06', icon: <ArrowUpIcon />,  title: 'Career Development',          description: 'Recruiting strategy, transfer portal guidance, draft preparation, and post-career transition — we think years ahead so you can focus on now.' },
]

function ServiceCard({ service, index }: { service: typeof services[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { rootMargin: '-60px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="service-card"
      style={{
        backgroundColor: '#0A0C10', padding: '40px', position: 'relative',
        boxShadow: 'inset 0 1px 0 rgba(216,232,244,0.07), 0 0 0 1px rgba(168,189,208,0.08)',
        transition: 'box-shadow 250ms, opacity 500ms, translate 500ms',
        opacity: visible ? 1 : 0,
        translate: visible ? '0 0' : '0 28px',
        transitionDelay: `${index * 80}ms`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'inset 0 1px 0 rgba(216,232,244,0.14), 0 0 0 1px rgba(26,114,232,0.28), 0 0 32px rgba(26,114,232,0.12)'
        const line = el.querySelector('.service-line') as HTMLElement
        if (line) line.style.width = '100%'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'inset 0 1px 0 rgba(216,232,244,0.07), 0 0 0 1px rgba(168,189,208,0.08)'
        const line = el.querySelector('.service-line') as HTMLElement
        if (line) line.style.width = '0'
      }}
    >
      {/* Number */}
      <p style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: '0.75rem', color: 'rgba(200,80,16,0.6)', letterSpacing: '0.3em', marginBottom: '16px', textTransform: 'uppercase' }}>
        {service.number}
      </p>
      {/* Icon */}
      <div style={{ color: '#A8BDD0', marginBottom: '16px', width: '24px', height: '24px' }}>
        {service.icon}
      </div>
      {/* Title */}
      <h3 style={{
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '1.5rem', marginBottom: '12px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {service.title}
      </h3>
      {/* Description */}
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', lineHeight: 1.65, color: '#A8BDD0' }}>
        {service.description}
      </p>
      {/* Bottom hover line */}
      <span className="service-line" style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', backgroundColor: '#C85010', width: '0', transition: 'width 500ms ease' }} />
    </div>
  )
}

export default function ServicesSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setHeaderVisible(true); obs.disconnect() }
    }, { rootMargin: '-80px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .services-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: rgba(168,189,208,0.1); }
        @media (min-width: 768px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .services-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
      <section style={{ padding: '128px 0', backgroundColor: '#0A0C10', position: 'relative', overflow: 'hidden' }}>
        {/* Logo watermark */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 'clamp(400px, 55vw, 700px)', opacity: 0.025, pointerEvents: 'none', zIndex: 0 }}>
          <img src="/logo.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>

        <div style={{ maxWidth: '1344px', margin: '0 auto', padding: '0 clamp(24px, 4vw, 32px)', position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div
            ref={headerRef}
            style={{
              textAlign: 'center', marginBottom: '80px',
              transition: 'opacity 600ms, translate 600ms',
              opacity: headerVisible ? 1 : 0,
              translate: headerVisible ? '0 0' : '0 24px',
            }}
          >
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, color: '#C85010', letterSpacing: '0.3em', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '16px' }}>
              OUR SERVICES
            </p>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(48px, 7vw, 80px)', lineHeight: 1, marginBottom: '24px',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(168,200,240,0.2))',
            }}>
              WHAT WE DO
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', color: '#A8BDD0', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
              End-to-end representation and brand-building for athletes and the brands that partner with them.
            </p>
          </div>

          {/* Cards */}
          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard key={service.number} service={service} index={index} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
