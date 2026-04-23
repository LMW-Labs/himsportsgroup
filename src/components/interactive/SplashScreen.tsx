import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const alreadyShown = typeof window !== 'undefined' && sessionStorage.getItem('splashShown') === '1'

  const [visible, setVisible] = useState(!alreadyShown)
  const [fading, setFading] = useState(false)
  const [mounted, setMounted] = useState(!alreadyShown)

  useEffect(() => {
    if (alreadyShown) return

    const fadeTimer = setTimeout(() => setFading(true), 2200)
    const unmountTimer = setTimeout(() => {
      setVisible(false)
      setMounted(false)
      sessionStorage.setItem('splashShown', '1')
    }, 2600)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(unmountTimer)
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      <style>{`
        @keyframes splashBarFill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0A0C10',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease',
        pointerEvents: visible ? 'all' : 'none',
      }}>
        <img src="/logo.png" alt="HIM Sports Group" style={{ width: '140px' }} />

        <span style={{
          fontFamily: 'Bebas Neue, sans-serif',
          fontSize: '24px',
          letterSpacing: '0.12em',
          background: 'linear-gradient(90deg, #A8BDD0, #D8E8F4, #A8BDD0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          HYCHE INTERNATIONAL
        </span>

        <div style={{
          width: '180px',
          height: '2px',
          background: 'rgba(168,189,208,0.15)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #1A72E8, #D8E8F4)',
            borderRadius: '2px',
            animation: 'splashBarFill 2s linear forwards',
          }} />
        </div>
      </div>
    </>
  )
}
