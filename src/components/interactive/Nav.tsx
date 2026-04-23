import { useState, useEffect, useRef } from 'react'

interface NavProps {}

const T = {
  bg:      '#0A0C10',
  surface: '#0E1220',
  silver:  'rgba(168,189,208,0.6)',
  chrome:  '#D8E8F4',
  border:  'rgba(168,189,208,0.12)',
}

const navLinks = [
  { label: 'Athletes', href: '/athletes' },
  { label: 'News',     href: '/news'     },
  { label: 'About',    href: '/about'    },
  { label: 'Brands',   href: '/brands'   },
  { label: 'Contact',  href: '/contact'  },
]

const athletesDropdown = [
  { label: 'All Athletes',   href: '/athletes'       },
  { label: 'Basketball',     href: '/athletes?sport=basketball' },
  { label: 'NIL',            href: '/athletes/nil'   },
  { label: 'Track & Field',  href: '/athletes?sport=track'     },
]

const linkStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  fontFamily: 'Rajdhani, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  color: active || hovered ? T.chrome : T.silver,
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'color 0.15s',
  background: 'transparent',
  border: 'none',
  padding: 0,
})

function HamburgerIcon({ open }: { open: boolean }) {
  const bar: React.CSSProperties = {
    display: 'block',
    width: '22px',
    height: '2px',
    background: T.chrome,
    transition: 'transform 0.25s, opacity 0.25s',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', cursor: 'pointer' }}>
      <span style={{ ...bar, transform: open ? 'translateY(7px) rotate(45deg)' : 'none' }} />
      <span style={{ ...bar, opacity: open ? 0 : 1 }} />
      <span style={{ ...bar, transform: open ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
    </div>
  )
}

export default function Nav(_props: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [hoveredLink, setHoveredLink] = useState<string | null>(null)
  const [hoveredDrop, setHoveredDrop] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10) }
    function onResize() { setIsMobile(window.innerWidth < 768) }
    onResize()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  function openDrop() {
    if (dropTimer.current) clearTimeout(dropTimer.current)
    setDropOpen(true)
  }

  function scheduleDrop() {
    dropTimer.current = setTimeout(() => setDropOpen(false), 200)
  }

  const navBg: React.CSSProperties = scrolled
    ? { background: 'rgba(10,12,16,0.97)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
    : { background: 'transparent' }

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mobileMenuIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '72px',
        transition: 'background 0.3s, backdrop-filter 0.3s',
        ...navBg,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          height: '100%',
          padding: '0 clamp(24px,4vw,96px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/logo.png" alt="HIM Sports Group" style={{ height: '40px' }} />
          </a>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              {navLinks.map(link => {
                const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                const hovered = hoveredLink === link.href

                if (link.label === 'Athletes') {
                  return (
                    <div
                      key={link.href}
                      style={{ position: 'relative' }}
                      onMouseEnter={openDrop}
                      onMouseLeave={scheduleDrop}
                    >
                      <a
                        href={link.href}
                        style={{ ...linkStyle(active, hovered || dropOpen), display: 'flex', alignItems: 'center', gap: '5px' }}
                        onMouseEnter={() => setHoveredLink(link.href)}
                        onMouseLeave={() => setHoveredLink(null)}
                      >
                        {link.label}
                        <svg width="8" height="5" viewBox="0 0 8 5" fill="none" style={{ transition: 'transform 0.2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                          <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </a>

                      {dropOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 12px)',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: '6px',
                            padding: '8px 0',
                            minWidth: '160px',
                            animation: 'slideDown 0.18s ease',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                          }}
                          onMouseEnter={openDrop}
                          onMouseLeave={scheduleDrop}
                        >
                          {athletesDropdown.map(item => (
                            <a
                              key={item.href + item.label}
                              href={item.href}
                              style={{
                                display: 'block',
                                padding: '9px 20px',
                                fontFamily: 'Rajdhani, sans-serif',
                                fontWeight: 700,
                                fontSize: '11px',
                                letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                textDecoration: 'none',
                                color: hoveredDrop === item.label ? T.chrome : T.silver,
                                transition: 'color 0.12s',
                              }}
                              onMouseEnter={() => setHoveredDrop(item.label)}
                              onMouseLeave={() => setHoveredDrop(null)}
                            >
                              {item.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                }

                return (
                  <a
                    key={link.href}
                    href={link.href}
                    style={linkStyle(active, hovered)}
                    onMouseEnter={() => setHoveredLink(link.href)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {link.label}
                  </a>
                )
              })}
            </div>
          )}

          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <HamburgerIcon open={menuOpen} />
            </button>
          )}
        </div>
      </nav>

      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed',
          top: '72px',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          background: 'rgba(10,12,16,0.98)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '32px clamp(24px,4vw,96px)',
          animation: 'mobileMenuIn 0.22s ease',
          overflowY: 'auto',
        }}>
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '22px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: active ? T.chrome : T.silver,
                  textDecoration: 'none',
                  padding: '14px 0',
                  borderBottom: `1px solid ${T.border}`,
                  transition: 'color 0.15s',
                }}
              >
                {link.label}
              </a>
            )
          })}

          <div style={{ marginTop: '8px', paddingLeft: '16px', borderLeft: `2px solid ${T.border}` }}>
            {athletesDropdown.slice(1).map(item => (
              <a
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 600,
                  fontSize: '14px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: T.silver,
                  textDecoration: 'none',
                  padding: '10px 0',
                  transition: 'color 0.15s',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
