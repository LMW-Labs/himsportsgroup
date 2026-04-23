import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: '50+', label: 'Athletes Represented', numeric: 50 },
  { value: '26+', label: 'Countries',             numeric: 26 },
  { value: '38+', label: 'States',                numeric: 38 },
  { value: '$2M+', label: 'NIL Value Secured',    numeric: 2, prefix: '$', suffix: 'M+' },
]

function AnimatedStat({ stat, active }: { stat: typeof stats[0]; active: boolean }) {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!active) return
    const duration = 800
    const fps = 60
    const frames = Math.round(duration / (1000 / fps))
    let frame = 0
    const id = setInterval(() => {
      frame++
      const progress = frame / frames
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * stat.numeric)
      if (stat.prefix || stat.suffix) {
        setDisplay(`${stat.prefix ?? ''}${current}${stat.suffix ?? ''}`)
      } else {
        setDisplay(`${current}+`)
      }
      if (frame >= frames) {
        setDisplay(stat.value)
        clearInterval(id)
      }
    }, 1000 / fps)
    return () => clearInterval(id)
  }, [active, stat])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      padding: '32px 16px',
    }}>
      <span style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 'clamp(40px, 5vw, 64px)',
        lineHeight: 1,
        background: 'linear-gradient(180deg, #F4A060 0%, #E06828 30%, #C85010 60%, #8B3008 85%, #A04020 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8)) drop-shadow(0 0 16px rgba(200,80,16,0.3))',
      }}>
        {display}
      </span>
      <span style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 600,
        fontSize: '0.72rem',
        letterSpacing: '0.24em',
        color: '#A8BDD0',
        textTransform: 'uppercase',
        textAlign: 'center',
      }}>
        {stat.label}
      </span>
    </div>
  )
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        backgroundColor: '#0E1220',
        borderTop: '1px solid rgba(168,189,208,0.08)',
        borderBottom: '1px solid rgba(168,189,208,0.08)',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 clamp(24px, 4vw, 96px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
      }}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              borderRight: i < stats.length - 1 ? '1px solid rgba(168,189,208,0.08)' : 'none',
            }}
          >
            <AnimatedStat stat={stat} active={active} />
          </div>
        ))}
      </div>
    </div>
  )
}
