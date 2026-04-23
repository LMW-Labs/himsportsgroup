import { useState, useMemo } from 'react'
import type { Athlete } from '../../lib/supabase/types'
import AthleteCard from './AthleteCard'

interface AthleteFiltersProps {
  athletes: Athlete[]
}

type SortKey = 'name' | 'sport' | 'school'

const T = {
  bg:      '#0A0C10',
  surface: '#0E1220',
  brand:   '#1A72E8',
  silver:  '#A8BDD0',
  chrome:  '#D8E8F4',
  border:  'rgba(168,189,208,0.2)',
}

const inputBase: React.CSSProperties = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  color: T.chrome,
  fontFamily: 'DM Sans, sans-serif',
  padding: '12px 16px',
  outline: 'none',
  borderRadius: '4px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  width: '100%',
  transition: 'border-color 150ms, box-shadow 150ms',
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      type="text"
      placeholder="Search athletes…"
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputBase,
        ...(focused ? { borderColor: T.brand, boxShadow: '0 0 0 3px rgba(26,114,232,0.12)' } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...inputBase,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A8BDD0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: '36px',
        ...(focused ? { borderColor: T.brand, boxShadow: '0 0 0 3px rgba(26,114,232,0.12)' } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  )
}

export default function AthleteFilters({ athletes }: AthleteFiltersProps) {
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState('')
  const [sort, setSort] = useState<SortKey>('name')

  const filtered = useMemo(() => {
    let result = athletes

    if (sport) {
      result = result.filter(a =>
        a.sport.toLowerCase().includes(sport.toLowerCase())
      )
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.sport.toLowerCase().includes(q) ||
        (a.school ?? '').toLowerCase().includes(q) ||
        (a.position ?? '').toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'sport') return a.sport.localeCompare(b.sport) || a.name.localeCompare(b.name)
      if (sort === 'school') return (a.school ?? '').localeCompare(b.school ?? '') || a.name.localeCompare(b.name)
      return 0
    })

    return result
  }, [athletes, search, sport, sort])

  const controlsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto auto',
    gap: '12px',
    marginBottom: '32px',
    alignItems: 'center',
  }

  const controlsResponsiveStyle: React.CSSProperties = {
    display: 'grid',
    gap: '12px',
    marginBottom: '32px',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px',
  }

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '80px 24px',
    fontFamily: 'Rajdhani, sans-serif',
    fontWeight: 600,
    fontSize: '1.1rem',
    letterSpacing: '0.08em',
    color: T.silver,
    opacity: 0.5,
  }

  return (
    <div>
      <div style={controlsStyle}>
        <SearchInput value={search} onChange={setSearch} />
        <FilterSelect value={sport} onChange={setSport}>
          <option value="">All Sports</option>
          <option value="Basketball">Basketball</option>
          <option value="Football">Football</option>
          <option value="Track">Track &amp; Field</option>
          <option value="Other">Other</option>
        </FilterSelect>
        <FilterSelect value={sort} onChange={v => setSort(v as SortKey)}>
          <option value="name">Name A–Z</option>
          <option value="sport">Sport</option>
          <option value="school">School</option>
        </FilterSelect>
      </div>

      {filtered.length === 0 ? (
        <div style={emptyStyle}>No athletes found</div>
      ) : (
        <div style={gridStyle}>
          {filtered.map(a => (
            <AthleteCard key={a.id} athlete={a} />
          ))}
        </div>
      )}
    </div>
  )
}
