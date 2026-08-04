import { useState, useEffect, useMemo, useRef } from 'react'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:          '#0A0C10',
  surface:     '#0E1220',
  brand:       '#1A72E8',
  accent:      '#C85010',
  silver:      '#A8BDD0',
  chrome:      '#D8E8F4',
  border:      'rgba(168,189,208,0.2)',
  borderFaint: 'rgba(168,189,208,0.1)',
}

const PIN_KEY = 'hims_admin_pin'

interface Contact {
  id: string
  name: string
  name_verified: string | null
  organization: string
  current_org: string | null
  phone: string | null
  contact_role: string
  category: string
  years_known: string | null
  update_status: string
  notes: string | null
}

type Mode = 'school' | 'name'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const displayName = (c: Contact) => (c.name_verified?.trim() || c.name).trim()

/** School bucket for grouping — uses where they are NOW, falling back to the list value. */
function schoolOf(c: Contact): string {
  const raw = (c.current_org || c.organization || '').trim()
  if (!raw) return 'Unknown'
  if (/^(OUT AT|RETIRED|NOT FOUND|NOT ON|NO PROGRAM)/i.test(raw)) return 'No Current Program'
  return raw.replace(/\s*\(.*$/, '').trim() || 'Unknown'
}

const statusColor = (s: string) =>
  s === 'Confirmed' ? '#3FB950'
  : s === 'Moved' ? T.accent
  : s === 'Manual Review' ? '#D9A441'
  : T.silver

// ─── Primitives ───────────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  background:   T.bg,
  border:       `1px solid ${T.border}`,
  color:        T.chrome,
  fontFamily:   'DM Sans, sans-serif',
  padding:      '12px 16px',
  width:        '100%',
  outline:      'none',
  borderRadius: '4px',
  fontSize:     '0.95rem',
  boxSizing:    'border-box',
}

const eyebrow: React.CSSProperties = {
  fontFamily:    'Rajdhani, sans-serif',
  fontWeight:    600,
  fontSize:      '0.75rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color:         T.accent,
}

const label: React.CSSProperties = {
  fontFamily:    'Rajdhani, sans-serif',
  fontWeight:    600,
  fontSize:      '0.72rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color:         T.silver,
  marginBottom:  '4px',
}

function Btn({ children, variant = 'solid', ...rest }: any) {
  const base: React.CSSProperties = {
    fontFamily:    'Rajdhani, sans-serif',
    fontWeight:    700,
    fontSize:      '0.82rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding:       '11px 22px',
    borderRadius:  '4px',
    cursor:        rest.disabled ? 'not-allowed' : 'pointer',
    opacity:       rest.disabled ? 0.5 : 1,
    transition:    'all .15s ease',
  }
  const styles = variant === 'ghost'
    ? { ...base, background: 'transparent', border: `1px solid ${T.border}`, color: T.silver }
    : { ...base, background: T.brand, border: `1px solid ${T.brand}`, color: '#fff' }
  return <button style={styles} {...rest}>{children}</button>
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VIPContacts() {
  const [pin, setPin]           = useState('')
  const [authed, setAuthed]     = useState(false)
  const [pinError, setPinError] = useState('')
  const [checking, setChecking] = useState(false)

  const [contacts, setContacts] = useState<Contact[]>([])
  const [loadError, setLoadError] = useState('')

  const [mode, setMode]         = useState<Mode>('school')
  const [query, setQuery]       = useState('')
  const [role, setRole]         = useState('All')
  const [selectedId, setSelected] = useState<string | null>(null)

  const [notesDraft, setNotesDraft] = useState('')
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState('')
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Restore session PIN on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(PIN_KEY)
    if (stored) { setPin(stored); void authenticate(stored) }
  }, [])

  useEffect(() => () => { if (savedTimer.current) clearTimeout(savedTimer.current) }, [])

  async function authenticate(candidate: string) {
    if (!candidate) { setPinError('Enter your PIN.'); return }
    setChecking(true); setPinError('')
    try {
      const res = await fetch('/api/vip-contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin: candidate, action: 'list' }),
      })
      if (res.status === 401) {
        sessionStorage.removeItem(PIN_KEY)
        setPinError('Incorrect PIN.')
        setAuthed(false)
        return
      }
      if (!res.ok) { setLoadError('Could not load contacts. Try again.'); setAuthed(true); return }

      const data: { contacts: Contact[] } = await res.json()
      sessionStorage.setItem(PIN_KEY, candidate)
      setContacts(data.contacts)
      setAuthed(true)
    } catch {
      setPinError('Network error. Try again.')
    } finally {
      setChecking(false)
    }
  }

  function selectContact(c: Contact) {
    setSelected(c.id)
    setNotesDraft(c.notes ?? '')
    setSaveMsg('')
  }

  async function saveNotes() {
    if (!selectedId) return
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch('/api/vip-contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pin, action: 'updateNotes', id: selectedId, notes: notesDraft }),
      })
      if (!res.ok) {
        setSaveMsg(res.status === 401 ? 'Session expired — re-enter your PIN.' : 'Save failed.')
        if (res.status === 401) { sessionStorage.removeItem(PIN_KEY); setAuthed(false) }
        return
      }
      const data: { notes: string | null } = await res.json()
      setContacts(prev => prev.map(c => (c.id === selectedId ? { ...c, notes: data.notes } : c)))
      setSaveMsg('Saved')
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaveMsg(''), 2500)
    } catch {
      setSaveMsg('Network error.')
    } finally {
      setSaving(false)
    }
  }

  // ── Filtering + grouping ────────────────────────────────────────────────────
  /** Roles present in the data, most common first, so the chip row reflects reality. */
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of contacts) counts.set(c.contact_role, (counts.get(c.contact_role) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [contacts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return contacts.filter(c => {
      if (role !== 'All' && c.contact_role !== role) return false
      if (!q) return true
      return (
        displayName(c).toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        (c.current_org ?? '').toLowerCase().includes(q) ||
        (c.contact_role ?? '').toLowerCase().includes(q) ||
        (c.phone ?? '').includes(q)
      )
    })
  }, [contacts, query, role])

  const groups = useMemo(() => {
    if (mode === 'name') {
      const byLetter = new Map<string, Contact[]>()
      for (const c of [...filtered].sort((a, b) => displayName(a).localeCompare(displayName(b)))) {
        const k = displayName(c).charAt(0).toUpperCase()
        byLetter.set(k, [...(byLetter.get(k) ?? []), c])
      }
      return [...byLetter.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    }
    const bySchool = new Map<string, Contact[]>()
    for (const c of filtered) {
      const k = schoolOf(c)
      bySchool.set(k, [...(bySchool.get(k) ?? []), c])
    }
    return [...bySchool.entries()]
      .map(([k, v]) => [k, v.sort((a, b) => displayName(a).localeCompare(displayName(b)))] as [string, Contact[]])
      .sort((a, b) => a[0].localeCompare(b[0]))
  }, [filtered, mode])

  const selected = contacts.find(c => c.id === selectedId) ?? null
  const dirty = selected ? (selected.notes ?? '') !== notesDraft : false

  // ── PIN gate ────────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <section style={{ padding: '140px 0 100px', minHeight: '70vh' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px', padding: '36px' }}>
            <p style={eyebrow}>Private</p>
            <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(28px,5vw,40px)', color: T.chrome, lineHeight: 0.95, margin: '8px 0 12px' }}>
              VIP CONTACTS
            </h1>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.silver, lineHeight: 1.7, marginBottom: '26px' }}>
              Enter your admin PIN to open the contact list.
            </p>
            <form onSubmit={e => { e.preventDefault(); void authenticate(pin) }}>
              <div style={label}>Admin PIN</div>
              <input
                type="password"
                value={pin}
                onChange={e => { setPin(e.target.value); setPinError('') }}
                placeholder="Enter PIN"
                autoFocus
                style={inputBase}
              />
              {pinError && (
                <p style={{ color: T.accent, fontFamily: 'DM Sans, sans-serif', fontSize: '13px', marginTop: '10px' }}>{pinError}</p>
              )}
              <div style={{ marginTop: '22px' }}>
                <Btn type="submit" disabled={checking}>{checking ? 'Checking…' : 'Open Contacts'}</Btn>
              </div>
            </form>
          </div>
        </div>
      </section>
    )
  }

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <section style={{ padding: '110px 0 70px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 clamp(20px,3vw,40px)' }}>

        {/* Header */}
        <div style={{ marginBottom: '22px' }}>
          <p style={eyebrow}>Private Directory</p>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(28px,5vw,44px)', color: T.chrome, lineHeight: 0.95, margin: '6px 0 0' }}>
            VIP CONTACTS
          </h1>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: T.silver, marginTop: '8px' }}>
            {filtered.length} of {contacts.length} contacts · notes are editable, everything else is read-only
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: '4px', overflow: 'hidden' }}>
            {(['school', 'name'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.78rem',
                  letterSpacing: '0.1em', textTransform: 'uppercase', padding: '10px 20px',
                  cursor: 'pointer', border: 'none',
                  background: mode === m ? T.brand : 'transparent',
                  color:      mode === m ? '#fff' : T.silver,
                }}
              >
                By {m === 'school' ? 'School' : 'Name'}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name, school, or phone…"
            style={{ ...inputBase, flex: '1 1 260px', width: 'auto', padding: '10px 14px' }}
          />
        </div>

        {/* Role filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {[['All', contacts.length] as [string, number], ...roleCounts].map(([r, n]) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.74rem',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '7px 13px', borderRadius: '999px', cursor: 'pointer',
                background: role === r ? 'rgba(200,80,16,0.16)' : 'transparent',
                border: `1px solid ${role === r ? T.accent : T.border}`,
                color: role === r ? T.accent : T.silver,
                whiteSpace: 'nowrap',
              }}
            >
              {r} <span style={{ opacity: 0.65 }}>{n}</span>
            </button>
          ))}
        </div>

        {loadError && (
          <p style={{ color: T.accent, fontFamily: 'DM Sans, sans-serif', fontSize: '13px', marginBottom: '16px' }}>{loadError}</p>
        )}

        {/* Two-pane */}
        <div className="vip-panes" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 380px) 1fr', gap: '20px', alignItems: 'start' }}>

          {/* List */}
          <div style={{
            background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px',
            maxHeight: '68vh', overflowY: 'auto',
          }}>
            {groups.length === 0 && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: T.silver, padding: '20px' }}>
                No contacts match “{query}”.
              </p>
            )}
            {groups.map(([heading, rows]) => (
              <div key={heading}>
                <div style={{
                  position: 'sticky', top: 0, zIndex: 1,
                  background: T.bg, borderBottom: `1px solid ${T.borderFaint}`,
                  padding: '9px 16px',
                  fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.72rem',
                  letterSpacing: '0.12em', textTransform: 'uppercase', color: T.chrome,
                }}>
                  {heading} <span style={{ color: T.silver, fontWeight: 400 }}>({rows.length})</span>
                </div>
                {rows.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectContact(c)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: selectedId === c.id ? 'rgba(26,114,232,0.14)' : 'transparent',
                      borderLeft: `2px solid ${selectedId === c.id ? T.brand : 'transparent'}`,
                      borderTop: 'none', borderRight: 'none',
                      borderBottom: `1px solid ${T.borderFaint}`,
                      padding: '11px 16px',
                    }}
                  >
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.chrome, display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor(c.update_status), flexShrink: 0 }} />
                      {displayName(c)}
                      {c.notes && <span title="Has notes" style={{ color: T.accent, fontSize: '11px' }}>●</span>}
                    </div>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11.5px', color: T.silver, marginTop: '3px', paddingLeft: '13px' }}>
                      {mode === 'school' ? c.contact_role : `${c.contact_role} · ${schoolOf(c)}`}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Detail */}
          <div style={{ background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px', padding: '26px', minHeight: '320px' }}>
            {!selected ? (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.silver }}>
                Select a contact to see their info and notes.
              </p>
            ) : (
              <>
                <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(22px,3vw,32px)', color: T.chrome, lineHeight: 1, marginBottom: '4px' }}>
                  {displayName(selected)}
                </h2>
                <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.78rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor(selected.update_status), marginBottom: '22px' }}>
                  {selected.update_status}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px', marginBottom: '26px' }}>
                  <Detail label="Phone">
                    {selected.phone
                      ? <a href={`tel:${selected.phone.replace(/[^0-9+]/g, '')}`} style={{ color: T.brand, textDecoration: 'none' }}>{selected.phone}</a>
                      : '—'}
                  </Detail>
                  <Detail label="Currently">{selected.current_org || '—'}</Detail>
                  <Detail label="On Original List">{selected.organization}</Detail>
                  <Detail label="Role">{selected.contact_role}</Detail>
                  <Detail label="Category">{selected.category}</Detail>
                  <Detail label="Years Known">{selected.years_known || '—'}</Detail>
                  {selected.name_verified && selected.name_verified !== selected.name && (
                    <Detail label="Name On List">{selected.name}</Detail>
                  )}
                </div>

                <div style={{ borderTop: `1px solid ${T.borderFaint}`, paddingTop: '20px' }}>
                  <div style={{ ...label, marginBottom: '8px' }}>Notes</div>
                  <textarea
                    value={notesDraft}
                    onChange={e => { setNotesDraft(e.target.value); setSaveMsg('') }}
                    placeholder="Add notes about this contact…"
                    rows={7}
                    style={{ ...inputBase, resize: 'vertical', lineHeight: 1.65, fontSize: '14px' }}
                  />
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                    <Btn type="button" onClick={saveNotes} disabled={saving || !dirty}>
                      {saving ? 'Saving…' : 'Save Notes'}
                    </Btn>
                    {dirty && !saving && (
                      <Btn type="button" variant="ghost" onClick={() => { setNotesDraft(selected.notes ?? ''); setSaveMsg('') }}>
                        Cancel
                      </Btn>
                    )}
                    {saveMsg && (
                      <span style={{
                        fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                        color: saveMsg === 'Saved' ? '#3FB950' : T.accent,
                      }}>
                        {saveMsg}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .vip-panes { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}

function Detail({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={label}>{l}</div>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.chrome, lineHeight: 1.5 }}>
        {children}
      </div>
    </div>
  )
}
