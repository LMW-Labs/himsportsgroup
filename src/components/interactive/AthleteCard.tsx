import { useState } from 'react'
import type { Athlete } from '../../lib/supabase/types'

interface AthleteCardProps {
  athlete: Athlete
}

const T = {
  bg:      '#0A0C10',
  surface: '#0E1220',
  brand:   '#1A72E8',
  accent:  '#C85010',
  silver:  '#A8BDD0',
  chrome:  '#D8E8F4',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export default function AthleteCard({ athlete }: AthleteCardProps) {
  const [hovered, setHovered] = useState(false)

  const cardStyle: React.CSSProperties = {
    display: 'block',
    textDecoration: 'none',
    background: T.surface,
    border: hovered
      ? '1px solid rgba(200,80,16,0.4)'
      : '1px solid rgba(168,189,208,0.08)',
    borderRadius: '4px',
    overflow: 'hidden',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    boxShadow: hovered
      ? '0 16px 48px rgba(200,80,16,0.14), 0 4px 16px rgba(0,0,0,0.4)'
      : '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
    cursor: 'pointer',
  }

  const photoWrapStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: '75%',
    overflow: 'hidden',
    background: T.bg,
  }

  const photoStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center top',
    display: 'block',
    transition: 'transform 350ms ease',
    transform: hovered ? 'scale(1.04)' : 'scale(1)',
  }

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(26,114,232,0.1)',
    borderBottom: '1px solid rgba(26,114,232,0.12)',
  }

  const initialsStyle: React.CSSProperties = {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: 'clamp(40px, 6vw, 64px)',
    color: 'rgba(26,114,232,0.5)',
    letterSpacing: '0.04em',
    userSelect: 'none',
  }

  const bodyStyle: React.CSSProperties = {
    padding: '20px',
  }

  const nameStyle: React.CSSProperties = {
    fontFamily: 'Bebas Neue, sans-serif',
    fontSize: '1.5rem',
    letterSpacing: '0.03em',
    color: T.chrome,
    lineHeight: 1.05,
    marginBottom: '10px',
  }

  const badgeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '10px',
  }

  const sportBadgeStyle: React.CSSProperties = {
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#fff',
    background: T.brand,
    padding: '3px 10px',
    borderRadius: '2px',
    whiteSpace: 'nowrap',
  }

  const schoolStyle: React.CSSProperties = {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '13px',
    color: T.silver,
    lineHeight: 1.4,
    marginBottom: athlete.nil_value_display ? '10px' : 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const nilStyle: React.CSSProperties = {
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 700,
    fontSize: '13px',
    letterSpacing: '0.08em',
    color: T.accent,
    textTransform: 'uppercase',
  }

  return (
    <a
      href={`/athletes/${athlete.slug}`}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={photoWrapStyle}>
        {athlete.photo_url ? (
          <img
            src={athlete.photo_url}
            alt={athlete.name}
            style={photoStyle}
            loading="lazy"
          />
        ) : (
          <div style={placeholderStyle}>
            <span style={initialsStyle}>{getInitials(athlete.name)}</span>
          </div>
        )}
      </div>

      <div style={bodyStyle}>
        <div style={nameStyle}>{athlete.name}</div>

        <div style={badgeRowStyle}>
          <span style={sportBadgeStyle}>{athlete.sport}</span>
          {athlete.position && (
            <span style={{
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600,
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(168,189,208,0.5)',
            }}>
              {athlete.position}
            </span>
          )}
        </div>

        {athlete.school && (
          <div style={schoolStyle}>{athlete.school}</div>
        )}

        {athlete.nil_value_display && (
          <div style={nilStyle}>{athlete.nil_value_display}</div>
        )}
      </div>
    </a>
  )
}
