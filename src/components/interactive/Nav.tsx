import { useState, useEffect, useRef } from 'react'

// ─── Link data ────────────────────────────────────────────────────────────────
const ATHLETES_LINKS = [
  { label: 'Athletes Overview', href: '/athletes' },
  { label: 'Basketball',        href: '/athletes/basketball' },
  { label: 'NIL Practice',      href: '/athletes/nil' },
]
const ABOUT_LINKS = [
  { label: 'Our Story',  href: '/about' },
  { label: 'Our Team',   href: '/about/team' },
  { label: 'Careers',    href: '/careers' },
  { label: 'Contact',    href: '/contact' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconInstagram() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IconTwitterX() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
function IconTikTok() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.17 8.17 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isActive(path: string, pathname: string) {
  if (path === '/') return pathname === '/'
  return pathname.startsWith(path)
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({
  links, sectionLabel, open,
  onMouseEnter, onMouseLeave,
}: {
  links: { label: string; href: string }[]
  sectionLabel: string
  open: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        top: 'calc(100% + 16px)',
        left: '50%',
        transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-8px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
        transition: 'opacity 180ms ease, transform 180ms ease',
        backgroundColor: 'rgba(14,18,32,0.98)',
        border: '1px solid rgba(168,189,208,0.12)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(26,114,232,0.06)',
        borderRadius: '8px',
        padding: '28px 32px',
        minWidth: '460px',
        zIndex: 200,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div style={{
        fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
        fontSize: '0.65rem', letterSpacing: '0.35em',
        color: 'var(--color-accent)', marginBottom: '10px', textTransform: 'uppercase',
      }}>
        {sectionLabel}
      </div>
      <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(26,114,232,0.3), transparent)', marginBottom: '18px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 28px' }}>
        {links.map(link => (
          <a
            key={link.href}
            href={link.href}
            style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
              fontSize: '1rem', letterSpacing: '0.06em',
              color: 'var(--color-silver)', textDecoration: 'none',
              padding: '9px 0', display: 'block',
              textTransform: 'uppercase',
              borderBottom: '1px solid rgba(168,189,208,0.05)',
              transition: 'color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-chrome)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-silver)' }}
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}

// ─── Main Nav island ──────────────────────────────────────────────────────────
export default function Nav() {
  const [pathname, setPathname]             = useState(() => typeof window !== 'undefined' ? window.location.pathname : '/')
  const [scrolled, setScrolled]             = useState(false)
  const [scrollPct, setScrollPct]           = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [menuOpen, setMenuOpen]             = useState(false)
  const dropTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync pathname on client navigation
  useEffect(() => {
    function sync() { setPathname(window.location.pathname) }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  // Scroll tracking
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60)
      const docH = document.documentElement.scrollHeight - window.innerHeight
      setScrollPct(docH > 0 ? (window.scrollY / docH) * 100 : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function openDropdown(name: string) {
    if (dropTimer.current) clearTimeout(dropTimer.current)
    setActiveDropdown(name)
  }
  function scheduleClose() {
    dropTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  const navItems = [
    { label: 'Athletes', key: 'athletes', path: '/athletes', links: ATHLETES_LINKS, sectionLabel: 'Talent' },
    { label: 'About',    key: 'about',    path: '/about',    links: ABOUT_LINKS,    sectionLabel: 'Agency' },
  ]

  // Shared nav link style
  function linkStyle(path: string): React.CSSProperties {
    const active = isActive(path, pathname)
    return {
      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
      fontSize: '0.95rem', letterSpacing: '0.18em',
      textDecoration: 'none', textTransform: 'uppercase',
      color: active ? 'var(--color-chrome)' : 'var(--color-silver)',
      background: 'none', border: 'none', outline: 'none',
      cursor: 'pointer', padding: '4px 0',
      position: 'relative', transition: 'color 150ms',
    }
  }

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        transition: 'background-color 300ms ease, backdrop-filter 300ms ease',
        backgroundColor: scrolled ? 'rgba(10,12,16,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(168,189,208,0.08)' : '1px solid transparent',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto', padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: '84px', position: 'relative',
        }}>

          {/* Logo */}
          <a href="/" style={{ textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/gc-logo.png"
              alt="Hyche International Management Sports Group"
              style={{ height: '72px', width: 'auto', display: 'block' }}
              onError={e => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement
                if (fallback) fallback.style.display = 'flex'
              }}
            />
            <span style={{ display: 'none', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', letterSpacing: '0.12em', color: 'var(--color-chrome)' }}>HYCHE</span>
              <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.3em', color: 'var(--color-accent)', textTransform: 'uppercase' }}>SPORTS GROUP</span>
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="nav-desktop">
            {navItems.map(item => (
              <div
                key={item.key}
                style={{ position: 'relative' }}
                onMouseEnter={() => openDropdown(item.key)}
                onMouseLeave={scheduleClose}
              >
                <button
                  style={{
                    ...linkStyle(item.path),
                    color: isActive(item.path, pathname) || activeDropdown === item.key ? 'var(--color-chrome)' : 'var(--color-silver)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-chrome)' }}
                  onMouseLeave={e => { if (!isActive(item.path, pathname)) (e.currentTarget as HTMLElement).style.color = 'var(--color-silver)' }}
                  onClick={() => { window.location.href = item.path }}
                >
                  {item.label}
                  {isActive(item.path, pathname) && <ActiveBar />}
                </button>
                <Dropdown
                  links={item.links}
                  sectionLabel={item.sectionLabel}
                  open={activeDropdown === item.key}
                  onMouseEnter={() => openDropdown(item.key)}
                  onMouseLeave={scheduleClose}
                />
              </div>
            ))}

            {[{ label: 'Brands', href: '/brands' }, { label: 'News', href: '/news' }].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                style={linkStyle(href)}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-chrome)' }}
                onMouseLeave={e => { if (!isActive(href, pathname)) (e.currentTarget as HTMLElement).style.color = 'var(--color-silver)' }}
              >
                {label}
                {isActive(href, pathname) && <ActiveBar />}
              </a>
            ))}

            {/* CTA */}
            <a
              href="/contact"
              className="nav-cta"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.3), 0 6px 28px rgba(200,80,16,0.6), 0 0 50px rgba(200,80,16,0.3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(200,80,16,0.35)' }}
            >
              Join Our Roster →
            </a>
          </nav>

          {/* Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMenuOpen(v => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            <span style={{
              display: 'block', width: '24px', height: '2px',
              backgroundColor: 'var(--color-silver)', borderRadius: '2px',
              transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none',
              transition: 'transform 250ms ease',
            }} />
            <span style={{
              display: 'block', width: '24px', height: '2px',
              backgroundColor: 'var(--color-silver)', borderRadius: '2px',
              opacity: menuOpen ? 0 : 1,
              transition: 'opacity 200ms ease',
            }} />
            <span style={{
              display: 'block', width: '24px', height: '2px',
              backgroundColor: 'var(--color-silver)', borderRadius: '2px',
              transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none',
              transition: 'transform 250ms ease',
            }} />
          </button>
        </div>

        {/* Scroll progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: '2px',
          width: `${scrollPct}%`,
          background: 'linear-gradient(90deg, var(--color-brand), var(--color-accent))',
          transition: 'width 100ms linear',
          pointerEvents: 'none',
        }} />
      </header>

      {/* Mobile overlay */}
      <div
        className="mobile-menu"
        style={{
          opacity: menuOpen ? 1 : 0,
          transform: menuOpen ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
      >
        {/* Athletes section */}
        <MobileSection heading="ATHLETES" links={ATHLETES_LINKS} pathname={pathname} baseDelay={0} />

        {/* Brands + News */}
        <MobileSection
          heading=""
          links={[{ label: 'Brands', href: '/brands' }, { label: 'News', href: '/news' }]}
          pathname={pathname}
          baseDelay={0.18}
        />

        {/* Agency section */}
        <MobileSection heading="AGENCY" links={ABOUT_LINKS} pathname={pathname} baseDelay={0.28} />

        {/* Social icons */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '12px', marginBottom: '28px' }}>
          {[
            { Icon: IconInstagram, href: 'https://instagram.com/chrishyche' },
            { Icon: IconTwitterX,  href: '#' },
            { Icon: IconTikTok,    href: '#' },
          ].map(({ Icon, href }, i) => (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--color-silver)', transition: 'color 150ms' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-chrome)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--color-silver)' }}
            >
              <Icon />
            </a>
          ))}
        </div>

        {/* Mobile CTA */}
        <a
          href="/contact"
          style={{
            display: 'block', textAlign: 'center',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            fontSize: '1rem', letterSpacing: '0.18em', textTransform: 'uppercase',
            textDecoration: 'none', color: '#fff',
            background: 'linear-gradient(135deg, #C85010, #E06828)',
            padding: '18px 32px', borderRadius: '4px',
          }}
        >
          Join Our Roster →
        </a>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ActiveBar() {
  return (
    <span style={{
      position: 'absolute', bottom: '-2px', left: 0, right: 0,
      height: '2px',
      background: 'var(--color-brand)',
      borderRadius: '1px',
      boxShadow: '0 0 8px rgba(26,114,232,0.9), 0 0 20px rgba(26,114,232,0.5)',
    }} />
  )
}

function MobileSection({
  heading, links, pathname, baseDelay,
}: {
  heading: string
  links: { label: string; href: string }[]
  pathname: string
  baseDelay: number
}) {
  return (
    <div style={{ marginBottom: '36px' }}>
      {heading && (
        <div style={{
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: '0.65rem', letterSpacing: '0.35em',
          color: 'var(--color-accent)', marginBottom: '12px', textTransform: 'uppercase',
        }}>
          {heading}
        </div>
      )}
      {links.map((link, i) => {
        const active = isActive(link.href, pathname)
        return (
          <a
            key={link.href}
            href={link.href}
            style={{
              display: 'block',
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: '1.5rem', letterSpacing: '0.06em',
              color: active ? 'var(--color-chrome)' : 'var(--color-silver)',
              textDecoration: 'none',
              padding: '11px 0',
              paddingLeft: active ? '16px' : '0',
              borderBottom: '1px solid rgba(168,189,208,0.06)',
              borderLeft: active ? '3px solid var(--color-accent)' : '3px solid transparent',
              textTransform: 'uppercase',
              transition: 'all 200ms',
              animationDelay: `${baseDelay + i * 0.05}s`,
            }}
          >
            {link.label}
          </a>
        )
      })}
    </div>
  )
}
