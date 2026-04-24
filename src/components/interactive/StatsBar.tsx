import { useEffect, useRef, useState } from 'react'

const stats = [
  { raw: 5,  prefix: '',  suffix: '',   label: 'Athletes Represented' },
  { raw: 3,  prefix: '$', suffix: 'M+', label: 'Deal In Progress'     },
  { raw: 26, prefix: '',  suffix: '+',  label: 'Countries Reached'    },
  { raw: 12, prefix: '',  suffix: '',   label: 'Years In The Game'     },
]

function CounterStat({ stat, isVisible }: { stat: typeof stats[number]; isVisible: boolean }) {
  const [count, setCount] = useState(0)
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!isVisible || hasStarted.current) return
    hasStarted.current = true
    const steps = 60, duration = 1400
    let current = 0
    const increment = stat.raw / steps
    const timer = setInterval(() => {
      current += increment
      if (current >= stat.raw) { setCount(stat.raw); clearInterval(timer) }
      else setCount(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [isVisible, stat.raw])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 32px' }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(40px, 5vw, 56px)', color: '#D8E8F4', lineHeight: 1, letterSpacing: '0.02em' }}>
        {stat.prefix}{count}{stat.suffix}
      </span>
      <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, fontSize: '0.68rem', letterSpacing: '0.25em', color: 'rgba(168,189,208,0.55)', textTransform: 'uppercase', marginTop: '8px' }}>
        {stat.label}
      </span>
    </div>
  )
}

export default function StatsBar() {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect() }
    }, { rootMargin: '-60px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style>{`
        .stats-desktop { display: none; }
        .stats-mobile  { display: grid; grid-template-columns: 1fr 1fr; }
        @media (min-width: 768px) {
          .stats-desktop { display: flex; }
          .stats-mobile  { display: none; }
        }
      `}</style>
      <section
        ref={ref}
        style={{
          padding: '0',
          background: 'linear-gradient(90deg, #0E1220, #0A0C10, #0E1220)',
          borderTop: '1px solid rgba(168,189,208,0.08)',
          borderBottom: '1px solid rgba(168,189,208,0.08)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Desktop */}
          <div className="stats-desktop" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
            {stats.map((stat, index) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CounterStat stat={stat} isVisible={inView} />
                {index < stats.length - 1 && (
                  <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(168,189,208,0.12)', flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
          {/* Mobile */}
          <div className="stats-mobile">
            {stats.map(stat => <CounterStat key={stat.label} stat={stat} isVisible={inView} />)}
          </div>
        </div>
      </section>
    </>
  )
}
