import { useEffect, useRef, useState } from 'react'

/* ─── Text Scramble ─────────────────────────────────────────────────────────── */
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function useScrambleText(finalText: string, startDelay = 0) {
  const [display, setDisplay] = useState(() => finalText.replace(/[A-Z0-9]/g, '?'))

  useEffect(() => {
    const timeout = setTimeout(() => {
      const letters = finalText.split('')
      const cycles = new Array(letters.length).fill(0)
      const maxCycles = 8
      const interval = setInterval(() => {
        let allDone = true
        const next = letters.map((char, i) => {
          if (char === ' ' || char === ',' || char === '.') return char
          if (cycles[i] >= maxCycles) return char
          allDone = false
          cycles[i]++
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        setDisplay(next.join(''))
        if (allDone) { clearInterval(interval); setDisplay(finalText) }
      }, 50)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [finalText, startDelay])

  return display
}

/* ─── Canvas Globe ──────────────────────────────────────────────────────────── */
function GlobeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const SIZE = 500
    canvas.width = SIZE
    canvas.height = SIZE
    const cx = SIZE / 2, cy = SIZE / 2, R = 190
    let angle = 0, dotAngle = 0

    function project(lat: number, lon: number, rotY: number) {
      const phi = (lat * Math.PI) / 180
      const lam = (lon * Math.PI) / 180 + rotY
      const x = R * Math.cos(phi) * Math.sin(lam)
      const y = R * Math.sin(phi)
      const z = R * Math.cos(phi) * Math.cos(lam)
      return { x: cx + x, y: cy - y, z }
    }

    function drawLatLines(rotY: number) {
      ctx.lineWidth = 0.7
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(26,114,232,${lat === 0 ? 0.6 : 0.35})`
        let first = true
        for (let lon = 0; lon <= 360; lon += 3) {
          const { x, y, z } = project(lat, lon, rotY)
          if (first) { ctx.moveTo(x, y); first = false }
          else if (z > 0) ctx.lineTo(x, y)
          else ctx.moveTo(x, y)
        }
        ctx.stroke()
      }
    }

    function drawLonLines(rotY: number) {
      ctx.lineWidth = 0.6
      for (let lon = 0; lon < 360; lon += 20) {
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(200,80,16,0.25)'
        let first = true
        for (let lat = -90; lat <= 90; lat += 3) {
          const { x, y, z } = project(lat, lon, rotY)
          if (first) { ctx.moveTo(x, y); first = false }
          else if (z > 0) ctx.lineTo(x, y)
          else ctx.moveTo(x, y)
        }
        ctx.stroke()
      }
    }

    function drawOrbitalRing() {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(0.38)
      ctx.scale(1, 0.36)
      ctx.beginPath()
      ctx.arc(0, 0, R + 44, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(168,189,208,0.3)'
      ctx.lineWidth = 1.2
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, R + 60, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(168,189,208,0.1)'
      ctx.lineWidth = 0.8
      ctx.stroke()
      ctx.restore()
    }

    function drawDot(dotA: number) {
      const orbitR = R + 44, tilt = 0.38, flat = 0.36
      const rawX = orbitR * Math.cos(dotA)
      const rawY = orbitR * Math.sin(dotA) * flat
      const x = cx + rawX * Math.cos(tilt) - rawY * Math.sin(tilt)
      const y = cy + rawX * Math.sin(tilt) + rawY * Math.cos(tilt)
      const grad = ctx.createRadialGradient(x, y, 0, x, y, 14)
      grad.addColorStop(0, 'rgba(200,80,16,0.95)')
      grad.addColorStop(0.4, 'rgba(200,80,16,0.4)')
      grad.addColorStop(1, 'rgba(200,80,16,0)')
      ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2)
      ctx.fillStyle = grad; ctx.fill()
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#F0A070'; ctx.fill()
    }

    const hotspots = [
      { lat: 40.7, lon: -74 }, { lat: 33.7, lon: -84.4 }, { lat: 48.8, lon: 2.3 },
      { lat: 51.5, lon: -0.1 }, { lat: 35.7, lon: 139.7 }, { lat: -33.9, lon: 18.4 },
      { lat: 19.4, lon: -99.1 }, { lat: 33.9, lon: -6.8 }, { lat: 42.6, lon: 21.1 },
    ]

    const particles = Array.from({ length: 50 }, () => ({
      lat: (Math.random() - 0.5) * 160,
      lon: Math.random() * 360,
      size: Math.random() * 1.5 + 0.4,
    }))

    function draw() {
      ctx.clearRect(0, 0, SIZE, SIZE)
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35)
      atmo.addColorStop(0, 'rgba(26,114,232,0.0)')
      atmo.addColorStop(0.6, 'rgba(26,114,232,0.08)')
      atmo.addColorStop(1, 'rgba(26,114,232,0.0)')
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2)
      ctx.fillStyle = atmo; ctx.fill()

      const fill = ctx.createRadialGradient(cx - 50, cy - 50, 10, cx, cy, R)
      fill.addColorStop(0, 'rgba(26,114,232,0.09)')
      fill.addColorStop(1, 'rgba(10,12,16,0.0)')
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fillStyle = fill; ctx.fill()

      drawLatLines(angle); drawLonLines(angle)
      particles.forEach(p => {
        const { x, y, z } = project(p.lat, p.lon, angle)
        if (z > 0) {
          ctx.beginPath(); ctx.arc(x, y, p.size, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(216,232,244,0.4)'; ctx.fill()
        }
      })
      hotspots.forEach(h => {
        const { x, y, z } = project(h.lat, h.lon, angle)
        if (z > 10) {
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(26,114,232,0.6)'; ctx.lineWidth = 1; ctx.stroke()
          ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(61,158,255,0.9)'; ctx.fill()
        }
      })
      drawOrbitalRing(); drawDot(dotAngle)
      angle += 0.0035; dotAngle += 0.011
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '500px', opacity: 0.92, filter: 'drop-shadow(0 0 60px rgba(26,114,232,0.3))' }} />
  )
}

/* ─── Stat Counter ──────────────────────────────────────────────────────────── */
function StatCounter({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const numericStr = value.replace(/[^0-9.]/g, '')
  const numeric = parseFloat(numericStr)
  const prefix = value.startsWith('$') ? '$' : ''
  const hasSuffix = value.includes('+')
  const unit = value.replace(/[0-9$.+]/g, '').trim()
  const [displayed, setDisplayed] = useState('0')
  const hasStarted = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasStarted.current) return
      hasStarted.current = true
      const steps = 60, duration = 1200
      let current = 0
      const increment = numeric / steps
      const timer = setInterval(() => {
        current += increment
        if (current >= numeric) {
          setDisplayed(Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1))
          clearInterval(timer)
        } else {
          setDisplayed(Number.isInteger(numeric) ? String(Math.floor(current)) : current.toFixed(1))
        }
      }, duration / steps)
    }, { rootMargin: '-40px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [numeric])

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(38px, 4vw, 56px)', lineHeight: 1, letterSpacing: '0.02em',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 20px rgba(168,200,240,0.25))',
      }}>
        {prefix}{displayed}{unit}{hasSuffix ? '+' : ''}
      </span>
      <span style={{
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
        fontSize: '0.7rem', letterSpacing: '0.22em',
        color: '#A8BDD0', textTransform: 'uppercase', opacity: 0.8,
      }}>
        {label}
      </span>
    </div>
  )
}

/* ─── Hero ──────────────────────────────────────────────────────────────────── */
const stats = [
  { value: '5',    label: 'Athletes Represented' },
  { value: '$3M+', label: 'Deal In Progress' },
  { value: '26+',  label: 'Countries Reached' },
  { value: '12',   label: 'Years In The Game' },
]

export default function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [pulseActive, setPulseActive] = useState(true)

  const line1 = useScrambleText('YOUR NAME.', 200)
  const line2 = useScrambleText('YOUR BRAND.', 500)
  const line3 = useScrambleText('YOUR FUTURE.', 800)

  useEffect(() => {
    const t = setTimeout(() => setPulseActive(false), 3200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      if (contentRef.current) {
        contentRef.current.style.transform = `translateY(${window.scrollY * -0.33}px)`
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <style>{`
        @keyframes heroReveal {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroEyebrow {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes heroBounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(8px); }
        }
        .hero-globe-wrap { display: none; }
        @media (min-width: 1024px) { .hero-globe-wrap { display: flex; } }
        .hero-mobile-glow { display: block; }
        @media (min-width: 1024px) { .hero-mobile-glow { display: none; } }
      `}</style>

      <section
        style={{ position: 'relative', minHeight: '100svh', backgroundColor: '#0A0C10', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        aria-label="Hero"
      >
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(rgba(26,114,232,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(26,114,232,0.06) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.3) 75%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0.3) 75%, transparent 100%)',
        }} />

        {/* Radial glows */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '700px', height: '700px', pointerEvents: 'none', background: 'radial-gradient(circle at top right, rgba(26,114,232,0.16) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '600px', height: '600px', pointerEvents: 'none', background: 'radial-gradient(circle at bottom left, rgba(200,80,16,0.12) 0%, transparent 60%)' }} />

        <div ref={contentRef} style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', padding: 'clamp(96px, 12vh, 140px) clamp(24px, 4vw, 96px) 40px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>

                {/* Left: Content */}
                <div style={{ width: '100%', maxWidth: '620px', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                  {/* Eyebrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', animation: 'heroEyebrow 0.6s ease-out both' }}>
                    <span style={{ display: 'block', width: '28px', height: '1px', backgroundColor: '#C85010' }} />
                    <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.28em', color: '#A8BDD0', textTransform: 'uppercase' }}>
                      NIL · CONTRACT · BRAND · LEGACY
                    </span>
                  </div>

                  {/* Headline */}
                  <div style={{ lineHeight: 0.9, fontSize: 'clamp(72px, 10vw, 128px)', animation: 'heroReveal 0.7s ease-out 0.12s both' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", display: 'block', background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9)) drop-shadow(0 0 16px rgba(168,200,240,0.25))' }}>{line1}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", display: 'block', background: 'linear-gradient(180deg, #F4A060 0%, #E06828 30%, #C85010 60%, #8B3008 85%, #A04020 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.9)) drop-shadow(0 0 20px rgba(200,80,16,0.4))' }}>{line2}</div>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", display: 'block', background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9)) drop-shadow(0 0 16px rgba(168,200,240,0.25))' }}>{line3}</div>
                  </div>

                  {/* Subhead */}
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '17px', lineHeight: 1.65, color: '#A8BDD0', maxWidth: '460px', animation: 'heroReveal 0.6s ease-out 0.32s both' }}>
                    Founded by Chris Hyche — Jackson, Mississippi native, former Harlem Globetrotter, and professional basketball player across four countries. Boutique athlete representation built on lived experience.
                  </p>

                  {/* CTAs */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', paddingTop: '4px', animation: 'heroReveal 0.6s ease-out 0.48s both' }}>
                    <a
                      href="/contact"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
                        color: '#fff',
                        background: 'linear-gradient(180deg, #F4A060 0%, #E06828 30%, #C85010 60%, #8B3008 85%, #A04020 100%)',
                        padding: '14px 32px', borderRadius: '4px',
                        border: '1px solid rgba(232,138,26,0.3)',
                        boxShadow: pulseActive
                          ? 'inset 0 1px 0 rgba(255,255,255,0.35), 0 0 32px rgba(200,80,16,0.8), 0 4px 20px rgba(200,80,16,0.5)'
                          : 'inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.4), 0 4px 20px rgba(200,80,16,0.4)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                        transition: 'box-shadow 300ms, transform 200ms',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.4), 0 8px 30px rgba(200,80,16,0.6)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 20px rgba(200,80,16,0.4)' }}
                    >
                      Join Our Roster →
                    </a>
                    <a
                      href="/athletes"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
                        color: '#D8E8F4', border: '1px solid rgba(216,232,244,0.3)', padding: '14px 32px', borderRadius: '4px',
                        transition: 'background-color 200ms, border-color 200ms',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(216,232,244,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(216,232,244,0.5)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(216,232,244,0.3)' }}
                    >
                      Our Roster
                    </a>
                  </div>
                </div>

                {/* Right: Globe — desktop only */}
                <div className="hero-globe-wrap" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingLeft: '40px' }}>
                  <GlobeCanvas />
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ borderTop: '1px solid rgba(168,189,208,0.08)', position: 'relative', zIndex: 10 }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px clamp(24px, 4vw, 96px)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
              {stats.map(s => <StatCounter key={s.label} value={s.value} label={s.label} />)}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: '100px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          pointerEvents: 'none', opacity: scrolled ? 0 : 1, transition: 'opacity 400ms',
        }}>
          <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '0.62rem', letterSpacing: '0.3em', color: 'rgba(168,189,208,0.45)', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ animation: 'heroBounce 1.5s ease-in-out infinite' }}>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M1 1L10 10L19 1" stroke="rgba(168,189,208,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        {/* Mobile glow fallback */}
        <div className="hero-mobile-glow" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at 75% 25%, rgba(26,114,232,0.1) 0%, transparent 55%)' }} />
      </section>
    </>
  )
}
