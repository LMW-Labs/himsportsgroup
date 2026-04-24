import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'fading'>(() => {
    if (typeof window === 'undefined') return 'hidden'
    return sessionStorage.getItem('him_splash_seen') === 'true' ? 'hidden' : 'visible'
  })

  useEffect(() => {
    if (phase !== 'visible') return
    const t = setTimeout(() => {
      setPhase('fading')
      sessionStorage.setItem('him_splash_seen', 'true')
    }, 4000)
    return () => clearTimeout(t)
  }, [phase])

  if (phase === 'hidden') return null

  return (
    <>
      <style>{`
        @keyframes splashShieldIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed', inset: 0, backgroundColor: '#0A0C10',
          zIndex: 100, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', userSelect: 'none',
          opacity: phase === 'fading' ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out',
          pointerEvents: phase === 'fading' ? 'none' : 'auto',
        }}
        onTransitionEnd={() => { if (phase === 'fading') setPhase('hidden') }}
      >
        {/* Shield video */}
        <div style={{
          marginBottom: '32px', position: 'relative',
          animation: 'splashShieldIn 0.8s cubic-bezier(0.25,0.1,0.25,1) both',
        }}>
          <div style={{
            position: 'absolute', inset: '-40px',
            background: 'radial-gradient(ellipse at center, rgba(200,80,16,0.25) 0%, rgba(26,114,232,0.1) 50%, transparent 75%)',
            pointerEvents: 'none', borderRadius: '50%',
          }} />
          <video
            src="/shield-video.mp4"
            autoPlay muted loop playsInline
            style={{
              width: 'clamp(280px, 45vw, 480px)', height: 'auto', display: 'block',
              position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 0 40px rgba(200,80,16,0.5)) drop-shadow(0 0 80px rgba(26,114,232,0.2))',
            }}
          />
        </div>

        {/* Brand name */}
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(1.6rem, 4.5vw, 2.8rem)',
          letterSpacing: '0.12em', lineHeight: 1,
          marginBottom: '8px',
          background: 'linear-gradient(180deg, #FFFFFF 0%, #EAF4FF 8%, #C4DCEE 20%, #82AACC 35%, #4A7898 50%, #285878 62%, #4A7898 75%, #90B8D4 88%, #C8E0F4 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))',
          animation: 'splashFadeUp 0.5s ease-out 0.5s both',
        }}>
          HYCHE INTERNATIONAL
        </div>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 600,
          fontSize: 'clamp(0.7rem, 1.8vw, 0.9rem)',
          letterSpacing: '0.38em', color: '#A8BDD0',
          textTransform: 'uppercase', marginBottom: '56px',
          animation: 'splashFadeIn 0.4s ease-out 0.85s both',
        }}>
          MANAGEMENT
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '2px', backgroundColor: 'rgba(200,80,16,0.15)',
        }}>
          <div style={{
            height: '100%', backgroundColor: '#C85010',
            animation: 'splashProgress 3.2s ease-in-out 0.3s both',
          }} />
        </div>
      </div>
    </>
  )
}
