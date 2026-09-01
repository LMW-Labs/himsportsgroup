import { useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Inquiry {
  id: string
  name: string
  email: string
  type: 'athlete' | 'brand' | 'media' | 'general'
  message: string
  status: 'new' | 'contacted' | 'converted' | 'archived'
  notes: string | null
  contacted_at: string | null
  created_at: string
}

interface Athlete {
  id: string
  name: string
  sport: string
  school: string | null
  position: string | null
  status: string
  email: string | null
  phone: string | null
  published: boolean
  featured: boolean
  created_at: string
}

interface Agreement {
  id: string
  athlete_name: string
  effective_date: string
  term_years: number
  status: string
  agreement_url_token: string
  signed_at: string | null
  created_at: string
}

type Tab = 'leads' | 'roster' | 'agreements'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:          '#0A0C10',
  surface:     '#0E1220',
  surfaceHigh: '#131828',
  brand:       '#1A72E8',
  accent:      '#C85010',
  silver:      '#A8BDD0',
  chrome:      '#D8E8F4',
  border:      'rgba(168,189,208,0.2)',
  borderFaint: 'rgba(168,189,208,0.08)',
}

const LEAD_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  new:       { bg: 'rgba(26,114,232,0.15)',  color: '#60A5FA', label: 'New' },
  contacted: { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D', label: 'Contacted' },
  converted: { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80', label: 'Converted' },
  archived:  { bg: 'rgba(168,189,208,0.08)', color: '#94A3B8', label: 'Archived' },
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  athlete: { bg: 'rgba(200,80,16,0.15)',   color: '#F97316' },
  brand:   { bg: 'rgba(26,114,232,0.15)',  color: '#60A5FA' },
  media:   { bg: 'rgba(168,74,222,0.15)',  color: '#C084FC' },
  general: { bg: 'rgba(168,189,208,0.08)', color: '#94A3B8' },
}

const ATHLETE_STATUS: Record<string, { bg: string; color: string }> = {
  nil_client:   { bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  pro_prospect: { bg: 'rgba(26,114,232,0.15)', color: '#60A5FA' },
  rising_star:  { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D' },
  alumni:       { bg: 'rgba(168,189,208,0.08)', color: '#94A3B8' },
}

const AGREE_STATUS: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D' },
  signed:  { bg: 'rgba(34,197,94,0.15)',  color: '#4ADE80' },
  expired: { bg: 'rgba(168,189,208,0.08)', color: '#94A3B8' },
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function toCSV(headers: string[], rows: string[][]): string {
  const esc = (s: string) => `"${(s ?? '').replace(/"/g, '""')}"`
  return [headers, ...rows].map(r => r.map(esc).join(',')).join('\n')
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Badge({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: bg, color, fontSize: '0.7rem', fontFamily: 'Rajdhani, sans-serif',
      fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' as const,
      padding: '2px 8px', borderRadius: '3px', whiteSpace: 'nowrap' as const }}>
      {children}
    </span>
  )
}

function Btn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', border: `1px solid ${T.border}`, color: T.silver,
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.78rem',
      letterSpacing: '0.08em', textTransform: 'uppercase' as const,
      padding: '6px 14px', borderRadius: '4px', cursor: 'pointer',
    }}>
      {children}
    </button>
  )
}

function InlineEdit({ value, onSave, placeholder, multiline }: {
  value: string; onSave: (v: string) => void; placeholder?: string; multiline?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)

  function commit() {
    setEditing(false)
    if (draft !== value) onSave(draft)
  }

  if (!editing) return (
    <span onClick={() => { setDraft(value); setEditing(true) }}
      style={{ cursor: 'text', color: value ? T.chrome : T.silver,
        fontStyle: value ? 'normal' : 'italic', fontSize: '0.82rem',
        borderBottom: `1px dashed ${T.border}`, paddingBottom: '1px' }}>
      {value || placeholder || 'click to edit'}
    </span>
  )

  const baseStyle: React.CSSProperties = {
    background: T.surfaceHigh, border: `1px solid ${T.brand}`,
    color: T.chrome, padding: '4px 8px', borderRadius: '3px',
    fontSize: '0.82rem', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', width: '100%',
  }

  return multiline ? (
    <textarea rows={2} value={draft} autoFocus
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Escape') setEditing(false) }}
      style={{ ...baseStyle, resize: 'vertical' as const }} />
  ) : (
    <input value={draft} autoFocus
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
      style={baseStyle} />
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: 'left', padding: '8px 12px', color: T.silver,
      fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.72rem',
      textTransform: 'uppercase' as const, letterSpacing: '0.07em', whiteSpace: 'nowrap' as const }}>
      {children}
    </th>
  )
}

function Td({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: '10px 12px', ...style }}>{children}</td>
}

// ─── Leads Tab ────────────────────────────────────────────────────────────────
function LeadsTab({ leads, pin, onUpdate }: {
  leads: Inquiry[]
  pin: string
  onUpdate: (id: string, updates: Partial<Inquiry>) => void
}) {
  const STATUS_ORDER: Inquiry['status'][] = ['new', 'contacted', 'converted', 'archived']

  function cycleStatus(lead: Inquiry) {
    const next = STATUS_ORDER[(STATUS_ORDER.indexOf(lead.status) + 1) % STATUS_ORDER.length]
    onUpdate(lead.id, { status: next })
    fetch('/api/admin-data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, table: 'inquiries', id: lead.id, updates: { status: next } }),
    })
  }

  function saveNotes(lead: Inquiry, notes: string) {
    onUpdate(lead.id, { notes })
    fetch('/api/admin-data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, table: 'inquiries', id: lead.id, updates: { notes } }),
    })
  }

  function exportCSV() {
    const headers = ['Date', 'Name', 'Email', 'Type', 'Status', 'Message', 'Notes']
    const rows = leads.map(l => [
      fmtDate(l.created_at), l.name, l.email, l.type, l.status, l.message, l.notes ?? '',
    ])
    downloadCSV('hims-leads.csv', toCSV(headers, rows))
  }

  const counts = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
        {STATUS_ORDER.map(s => (
          <div key={s} style={{ background: T.surfaceHigh, border: `1px solid ${T.border}`,
            borderRadius: '6px', padding: '12px 20px', minWidth: '90px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: LEAD_STATUS[s].color,
              fontFamily: 'Rajdhani, sans-serif' }}>{counts[s]}</div>
            <div style={{ fontSize: '0.72rem', color: T.silver, textTransform: 'uppercase' as const,
              letterSpacing: '0.07em', fontFamily: 'Rajdhani, sans-serif' }}>{s}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}><Btn onClick={exportCSV}>Export CSV</Btn></div>
      </div>

      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <Th>Date</Th><Th>Name</Th><Th>Email</Th><Th>Type</Th><Th>Status</Th><Th>Message / Notes</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l, i) => (
              <tr key={l.id} style={{
                borderBottom: `1px solid ${T.borderFaint}`,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <Td style={{ color: T.silver, whiteSpace: 'nowrap' as const }}>{fmtDate(l.created_at)}</Td>
                <Td style={{ color: T.chrome, fontWeight: 500, whiteSpace: 'nowrap' as const }}>{l.name}</Td>
                <Td>
                  <a href={`mailto:${l.email}`} style={{ color: T.brand, textDecoration: 'none', fontSize: '0.82rem' }}>
                    {l.email}
                  </a>
                </Td>
                <Td>
                  <Badge bg={TYPE_COLORS[l.type]?.bg ?? TYPE_COLORS.general.bg}
                    color={TYPE_COLORS[l.type]?.color ?? TYPE_COLORS.general.color}>
                    {l.type}
                  </Badge>
                </Td>
                <Td>
                  <span onClick={() => cycleStatus(l)} style={{ cursor: 'pointer' }} title="Click to advance status">
                    <Badge bg={LEAD_STATUS[l.status].bg} color={LEAD_STATUS[l.status].color}>
                      {LEAD_STATUS[l.status].label}
                    </Badge>
                  </span>
                </Td>
                <Td style={{ maxWidth: '320px' }}>
                  <div style={{ color: T.silver, fontSize: '0.78rem', marginBottom: '6px',
                    maxHeight: '44px', overflow: 'hidden', lineHeight: 1.4 }}>
                    {l.message}
                  </div>
                  <InlineEdit value={l.notes ?? ''} onSave={v => saveNotes(l, v)} placeholder="Add notes..." multiline />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: '48px', color: T.silver }}>No leads yet.</div>
        )}
      </div>
    </div>
  )
}

// ─── Roster Tab ───────────────────────────────────────────────────────────────
function RosterTab({ athletes, pin, onUpdate }: {
  athletes: Athlete[]
  pin: string
  onUpdate: (id: string, updates: Partial<Athlete>) => void
}) {
  function saveField(athlete: Athlete, field: 'email' | 'phone', value: string) {
    onUpdate(athlete.id, { [field]: value })
    fetch('/api/admin-data', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, table: 'athletes', id: athlete.id, updates: { [field]: value } }),
    })
  }

  function exportCSV() {
    const headers = ['Name', 'Sport', 'School', 'Position', 'Status', 'Email', 'Phone', 'Published']
    const rows = athletes.map(a => [
      a.name, a.sport, a.school ?? '', a.position ?? '',
      a.status, a.email ?? '', a.phone ?? '', a.published ? 'Yes' : 'No',
    ])
    downloadCSV('hims-roster.csv', toCSV(headers, rows))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ color: T.silver, fontSize: '0.82rem' }}>
          {athletes.length} athletes &mdash; click email or phone cell to edit inline
        </div>
        <Btn onClick={exportCSV}>Export CSV</Btn>
      </div>

      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <Th>Name</Th><Th>Sport</Th><Th>School / Position</Th><Th>Status</Th><Th>Email</Th><Th>Phone</Th><Th>Pub</Th>
            </tr>
          </thead>
          <tbody>
            {athletes.map((a, i) => (
              <tr key={a.id} style={{
                borderBottom: `1px solid ${T.borderFaint}`,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <Td style={{ color: T.chrome, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{a.name}</Td>
                <Td style={{ color: T.silver, whiteSpace: 'nowrap' as const }}>{a.sport}</Td>
                <Td style={{ color: T.silver }}>
                  <div style={{ fontSize: '0.82rem' }}>{a.school ?? '—'}</div>
                  {a.position && <div style={{ fontSize: '0.73rem', color: '#6B7FA8' }}>{a.position}</div>}
                </Td>
                <Td>
                  <Badge
                    bg={ATHLETE_STATUS[a.status]?.bg ?? ATHLETE_STATUS.alumni.bg}
                    color={ATHLETE_STATUS[a.status]?.color ?? ATHLETE_STATUS.alumni.color}>
                    {a.status.replace('_', ' ')}
                  </Badge>
                </Td>
                <Td style={{ minWidth: '180px' }}>
                  <InlineEdit value={a.email ?? ''} onSave={v => saveField(a, 'email', v)} placeholder="add email" />
                </Td>
                <Td style={{ minWidth: '140px' }}>
                  <InlineEdit value={a.phone ?? ''} onSave={v => saveField(a, 'phone', v)} placeholder="add phone" />
                </Td>
                <Td style={{ textAlign: 'center' as const }}>
                  <span style={{ color: a.published ? '#4ADE80' : '#EF4444', fontSize: '1rem' }}>
                    {a.published ? '●' : '○'}
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {athletes.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: '48px', color: T.silver }}>No athletes yet.</div>
        )}
      </div>
    </div>
  )
}

// ─── Agreements Tab ───────────────────────────────────────────────────────────
function AgreementsTab({ agreements }: { agreements: Agreement[] }) {
  function exportCSV() {
    const headers = ['Athlete', 'Effective Date', 'Term (Years)', 'Status', 'Signed', 'Created']
    const rows = agreements.map(a => [
      a.athlete_name, a.effective_date, String(a.term_years),
      a.status, fmtDate(a.signed_at), fmtDate(a.created_at),
    ])
    downloadCSV('hims-agreements.csv', toCSV(headers, rows))
  }

  const signed  = agreements.filter(a => a.status === 'signed').length
  const pending = agreements.filter(a => a.status === 'pending').length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ color: T.silver, fontSize: '0.82rem' }}>
          {signed} signed &middot; {pending} pending
        </div>
        <Btn onClick={exportCSV}>Export CSV</Btn>
      </div>

      <div style={{ overflowX: 'auto' as const }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.83rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              <Th>Athlete</Th><Th>Effective Date</Th><Th>Term</Th><Th>Status</Th><Th>Signed</Th><Th>Link</Th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((a, i) => (
              <tr key={a.id} style={{
                borderBottom: `1px solid ${T.borderFaint}`,
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <Td style={{ color: T.chrome, fontWeight: 600, whiteSpace: 'nowrap' as const }}>{a.athlete_name}</Td>
                <Td style={{ color: T.silver, whiteSpace: 'nowrap' as const }}>{a.effective_date}</Td>
                <Td style={{ color: T.silver }}>{a.term_years} {a.term_years === 1 ? 'yr' : 'yrs'}</Td>
                <Td>
                  <Badge
                    bg={AGREE_STATUS[a.status]?.bg ?? AGREE_STATUS.pending.bg}
                    color={AGREE_STATUS[a.status]?.color ?? AGREE_STATUS.pending.color}>
                    {a.status}
                  </Badge>
                </Td>
                <Td style={{ color: T.silver, whiteSpace: 'nowrap' as const }}>{fmtDate(a.signed_at)}</Td>
                <Td>
                  {a.agreement_url_token ? (
                    <a href={`/nil-agreement?token=${a.agreement_url_token}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: T.brand, fontSize: '0.78rem', textDecoration: 'none' }}>
                      View →
                    </a>
                  ) : '—'}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
        {agreements.length === 0 && (
          <div style={{ textAlign: 'center' as const, padding: '48px', color: T.silver }}>No agreements yet.</div>
        )}
      </div>
    </div>
  )
}

// ─── Root Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [pin,     setPin]     = useState('')
  const [authed,  setAuthed]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState<Tab>('leads')

  const [leads,      setLeads]      = useState<Inquiry[]>([])
  const [athletes,   setAthletes]   = useState<Athlete[]>([])
  const [agreements, setAgreements] = useState<Agreement[]>([])

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-data', { headers: { 'x-admin-pin': pin } })
      if (res.status === 401) { setError('Incorrect PIN'); setLoading(false); return }
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setLeads(data.leads ?? [])
      setAthletes(data.roster ?? [])
      setAgreements(data.agreements ?? [])
      setAuthed(true)
    } catch {
      setError('Failed to load data. Check your connection.')
    }
    setLoading(false)
  }

  const updateLead    = useCallback((id: string, u: Partial<Inquiry>)  => setLeads(p => p.map(l => l.id === id ? { ...l, ...u } : l)), [])
  const updateAthlete = useCallback((id: string, u: Partial<Athlete>) => setAthletes(p => p.map(a => a.id === id ? { ...a, ...u } : a)), [])

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'leads',      label: 'Leads',      count: leads.length },
    { key: 'roster',     label: 'Roster',     count: athletes.length },
    { key: 'agreements', label: 'Agreements', count: agreements.length },
  ]

  // ── PIN Gate ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <form onSubmit={login} style={{ background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: '8px', padding: '48px 40px', width: '320px', textAlign: 'center' as const }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem',
          letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: T.silver, marginBottom: '6px' }}>
          HIMS <span style={{ color: T.brand }}>Admin</span>
        </div>
        <div style={{ color: '#6B7FA8', fontSize: '0.82rem', marginBottom: '28px' }}>
          Enter your PIN to access the CRM
        </div>
        <input
          type="password" value={pin} autoFocus
          onChange={e => setPin(e.target.value)}
          placeholder="••••"
          style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.chrome,
            padding: '12px 16px', borderRadius: '4px', width: '100%', fontSize: '1.2rem',
            textAlign: 'center' as const, letterSpacing: '0.3em', outline: 'none',
            fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' as const, marginBottom: '16px' }}
        />
        {error && <div style={{ color: '#F87171', fontSize: '0.8rem', marginBottom: '12px' }}>{error}</div>}
        <button type="submit" disabled={loading || !pin}
          style={{ width: '100%', padding: '12px', background: T.brand, border: 'none',
            borderRadius: '4px', color: '#fff', fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.1em',
            cursor: loading || !pin ? 'not-allowed' : 'pointer', opacity: !pin || loading ? 0.6 : 1 }}>
          {loading ? 'LOADING...' : 'ENTER'}
        </button>
      </form>
    </div>
  )

  // ── Dashboard ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'DM Sans, sans-serif', color: T.chrome }}>
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem',
          letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>
          HIMS <span style={{ color: T.brand }}>CRM</span>
        </span>
        <button onClick={() => { setAuthed(false); setPin('') }}
          style={{ background: 'transparent', border: 'none', color: T.silver,
            cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.07em', textTransform: 'uppercase' as const }}>
          Sign Out
        </button>
      </div>

      <div style={{ borderBottom: `1px solid ${T.border}`, padding: '0 32px', display: 'flex', gap: '4px' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              padding: '14px 20px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'uppercase' as const,
              color: tab === t.key ? T.brand : T.silver,
              borderBottom: tab === t.key ? `2px solid ${T.brand}` : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.15s' }}>
            {t.label}
            <span style={{ marginLeft: '6px', background: T.surfaceHigh, color: T.silver,
              fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px' }}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>
        {tab === 'leads'      && <LeadsTab      leads={leads}           pin={pin} onUpdate={updateLead} />}
        {tab === 'roster'     && <RosterTab     athletes={athletes}     pin={pin} onUpdate={updateAthlete} />}
        {tab === 'agreements' && <AgreementsTab agreements={agreements} />}
      </div>
    </div>
  )
}
