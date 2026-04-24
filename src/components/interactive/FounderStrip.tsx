import { useEffect, useRef, useState } from 'react'

const founder = {
  name: 'Chris Hyche',
  title: 'Founder & CEO',
  initials: 'CH',
  credentials: [
    { label: '26+', sublabel: 'Countries Played'  },
    { label: '38+', sublabel: 'States Traveled'   },
    { label: '4',   sublabel: 'Pro Leagues'        },
  ],
}

export default function FounderStrip() {
  const ref = useRef<HTMLElement>(null)
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
    <>
      <style>{`
        .founder-grid { display: grid; grid-template-columns: 1fr; gap: 72px; align-items: center; }
        @media (min-width: 768px) { .founder-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
      <section
        ref={ref}
        style={{
          padding: '100px 0', backgroundColor: '#0E1220',
          borderTop: '1px solid rgba(168,189,208,0.07)',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Logo watermark */}
        <div style={{ position: 'absolute', left: '-80px', bottom: '-60px', width: 'clamp(300px, 38vw, 520px)', opacity: 0.03, pointerEvents: 'none', zIndex: 0, filter: 'drop-shadow(0 0 30px rgba(200,80,16,0.3))' }}>
          <img src="/logo.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '500px', height: '500px', pointerEvents: 'none', zIndex: 1, background: 'radial-gradient(circle at top right, rgba(26,114,232,0.06) 0%, transparent 65%)' }} />

        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(24px, 4vw, 96px)', position: 'relative', zIndex: 2 }}>
          <div className="founder-grid">

            {/* Left — story */}
            <div style={{
              display: 'flex', flexDirection: 'column', gap: '24px',
              transition: 'opacity 650ms, translate 650ms',
              opacity: visible ? 1 : 0, translate: visible ? '0 0' : '-28px 0',
            }}>
              <div>
                <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.32em', color: '#C85010', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Our Story
                </p>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(44px, 5vw, 72px)', lineHeight: 0.92, background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8)) drop-shadow(0 0 12px rgba(168,200,240,0.2))' }}>
                  FROM JACKSON<br />
                  <span style={{ background: 'linear-gradient(180deg, #F4A060 0%, #E06828 30%, #C85010 60%, #8B3008 85%, #A04020 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    TO THE WORLD.
                  </span><br />
                  AND BACK.
                </h2>
              </div>

              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: '#A8BDD0', lineHeight: 1.75, maxWidth: '480px' }}>
                Chris Hyche grew up in Jackson, Mississippi — a Dandy Dozen honoree at Provine High School, then college ball at Jackson State and Talladega College. After college he went pro across four countries: Mexico, Kosovo, Morocco, and the ABA's Jackson Showboats.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(168,189,208,0.7)', lineHeight: 1.75, maxWidth: '480px' }}>
                In 2018 he joined the <strong style={{ color: '#D8E8F4', fontWeight: 500 }}>Harlem Globetrotters</strong>. 38 states. 26+ countries. Millions of fans. He didn't just play the game. He performed it. He branded it. He learned what it actually feels like to be the athlete in the room.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '15px', color: 'rgba(168,189,208,0.7)', lineHeight: 1.75, maxWidth: '480px' }}>
                Hyche International Management Sports Group was built on one belief: <em style={{ color: '#D8E8F4' }}>every athlete deserves an agent who was actually in the arena.</em>
              </p>

              <a
                href="/about"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.18em', color: '#1A72E8', textDecoration: 'none', textTransform: 'uppercase', transition: 'color 150ms', width: 'fit-content' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#D8E8F4' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#1A72E8' }}
              >
                Full Story →
              </a>
            </div>

            {/* Right — glassmorphism founder card */}
            <div style={{
              transition: 'opacity 650ms, translate 650ms',
              opacity: visible ? 1 : 0, translate: visible ? '0 0' : '28px 0',
              transitionDelay: '120ms',
            }}>
              <div style={{
                backgroundColor: 'rgba(10,12,16,0.7)', border: '1px solid rgba(168,189,208,0.12)',
                padding: '40px', backdropFilter: 'blur(8px)', position: 'relative', overflow: 'hidden',
                boxShadow: 'inset 0 1px 0 rgba(216,232,244,0.1), 0 4px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,189,208,0.06)',
              }}>
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent 0%, rgba(168,189,208,0.4) 20%, rgba(200,80,16,0.9) 50%, rgba(168,189,208,0.4) 80%, transparent 100%)', boxShadow: '0 0 12px rgba(200,80,16,0.4)' }} />

                {/* Pull quote */}
                <blockquote style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(22px, 2.8vw, 32px)', color: '#D8E8F4', lineHeight: 1.15, letterSpacing: '0.02em', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid rgba(168,189,208,0.08)' }}>
                  "GREAT AGENTS DIDN'T JUST WATCH THE GAME —{' '}
                  <span style={{ color: '#C85010' }}>THEY LIVED IT.</span>"
                  <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.2em', color: '#C85010', marginTop: '8px' }}>
                    — CHRIS HYCHE
                  </div>
                </blockquote>

                {/* Credential stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '28px' }}>
                  {founder.credentials.map(c => (
                    <div key={c.sublabel} style={{ textAlign: 'center', padding: '12px 8px' }}>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2.2rem', lineHeight: 1, marginBottom: '5px', background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8)) drop-shadow(0 0 16px rgba(168,200,240,0.2))' }}>
                        {c.label}
                      </div>
                      <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '0.58rem', letterSpacing: '0.18em', color: 'rgba(168,189,208,0.45)', textTransform: 'uppercase' }}>
                        {c.sublabel}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Globetrotter badge */}
                <div style={{ marginBottom: '28px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(200,80,16,0.1)', border: '1px solid rgba(200,80,16,0.25)', padding: '7px 14px', fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.22em', color: '#C85010', textTransform: 'uppercase' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#C85010', flexShrink: 0 }} />
                    HARLEM GLOBETROTTER · EST. 2018
                  </span>
                </div>

                {/* ASL note */}
                <div style={{ backgroundColor: 'rgba(26,114,232,0.05)', border: '1px solid rgba(26,114,232,0.15)', borderLeft: '3px solid #1A72E8', padding: '14px 16px' }}>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '12.5px', color: 'rgba(168,189,208,0.65)', lineHeight: 1.6, fontStyle: 'italic' }}>
                    Grew up in a deaf household. Native ASL speaker. Understands communication across barriers at a level most agents never encounter.
                  </p>
                </div>

                {/* Founder name */}
                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(26,114,232,0.15)', border: '1px solid rgba(26,114,232,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', color: '#1A72E8', flexShrink: 0 }}>
                    {founder.initials}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#D8E8F4', letterSpacing: '0.06em' }}>{founder.name}</div>
                    <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '0.6rem', letterSpacing: '0.2em', color: 'rgba(168,189,208,0.4)', textTransform: 'uppercase' }}>{founder.title}</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
