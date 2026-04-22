import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'athlete' | 'brand' | 'media'
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:      '#0A0C10',
  surface: '#0E1220',
  brand:   '#1A72E8',
  accent:  '#C85010',
  silver:  '#A8BDD0',
  chrome:  '#D8E8F4',
  border:  'rgba(168,189,208,0.2)',
}

// ─── Shared input/select/textarea styles ──────────────────────────────────────
const inputBase: React.CSSProperties = {
  background: T.bg,
  border: `1px solid ${T.border}`,
  color: T.chrome,
  fontFamily: 'DM Sans, sans-serif',
  padding: '12px 16px',
  width: '100%',
  outline: 'none',
  borderRadius: '4px',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
}

function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label style={{
          display: 'block', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
          color: T.silver, fontSize: '0.78rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', marginBottom: '6px',
        }}>
          {label}
        </label>
      )}
      {children}
      {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      style={{ ...inputBase, ...(focused ? { borderColor: T.brand, boxShadow: `0 0 0 3px rgba(26,114,232,0.12)` } : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      style={{
        ...inputBase, cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23A8BDD0' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', paddingRight: '36px',
        ...(focused ? { borderColor: T.brand, boxShadow: `0 0 0 3px rgba(26,114,232,0.12)` } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      style={{
        ...inputBase, resize: 'vertical', minHeight: '120px',
        ...(focused ? { borderColor: T.brand, boxShadow: `0 0 0 3px rgba(26,114,232,0.12)` } : {}),
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

function SubmitBtn({ status }: { status: SubmitStatus }) {
  if (status === 'loading') {
    return (
      <button disabled style={{ width: '100%', padding: '14px', background: 'rgba(200,80,16,0.5)', border: 'none', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'not-allowed' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'cfSpin 0.8s linear infinite' }}>
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span style={{ color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em' }}>SENDING…</span>
      </button>
    )
  }
  if (status === 'success') {
    return (
      <button disabled style={{ width: '100%', padding: '14px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'not-allowed' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span style={{ color: '#22c55e', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.08em' }}>MESSAGE SENT!</span>
      </button>
    )
  }
  return (
    <button
      type="submit"
      style={{ width: '100%', padding: '14px', background: 'linear-gradient(to right, #C85010, #E06828)', border: 'none', borderRadius: '4px', color: 'white', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em', cursor: 'pointer', transition: 'opacity 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    >
      SEND MESSAGE
    </button>
  )
}

// ─── Athlete Form ─────────────────────────────────────────────────────────────
function AthleteForm({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [vals, setVals] = useState({ first_name: '', last_name: '', email: '', phone: '', sport: '', school: '', class_year: '', message: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setVals(v => ({ ...v, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!vals.first_name) errs.first_name = 'Required'
    if (!vals.last_name) errs.last_name = 'Required'
    if (!vals.email) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Enter a valid email'
    if (!vals.sport) errs.sport = 'Required'
    if (!vals.school) errs.school = 'Required'
    if (!vals.class_year) errs.class_year = 'Required'
    if (vals.message.length < 20) errs.message = 'At least 20 characters'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('loading')
    const name = `${vals.first_name} ${vals.last_name}`
    const message = `Sport: ${vals.sport}\nSchool: ${vals.school}\nClass: ${vals.class_year}${vals.phone ? `\nPhone: ${vals.phone}` : ''}\n\n${vals.message}`
    const { error } = await supabase.from('inquiries').insert({ name, email: vals.email, type: 'athlete', message })
    if (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('success')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="First Name" error={errors.first_name}><Input placeholder="Marcus" value={vals.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last Name" error={errors.last_name}><Input placeholder="Johnson" value={vals.last_name} onChange={set('last_name')} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Email" error={errors.email}><Input type="email" placeholder="your@email.com" value={vals.email} onChange={set('email')} /></Field>
        <Field label="Phone (optional)"><Input type="tel" placeholder="+1 (555) 000-0000" value={vals.phone} onChange={set('phone')} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Sport" error={errors.sport}>
          <Select value={vals.sport} onChange={set('sport')}>
            <option value="">Select sport…</option>
            <option>Basketball</option><option>Football</option><option>Track</option><option>Other</option>
          </Select>
        </Field>
        <Field label="School" error={errors.school}><Input placeholder="University name" value={vals.school} onChange={set('school')} /></Field>
      </div>
      <Field label="Class Year" error={errors.class_year}>
        <Select value={vals.class_year} onChange={set('class_year')}>
          <option value="">Select year…</option>
          <option>Freshman</option><option>Sophomore</option><option>Junior</option><option>Senior</option><option>Graduate</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message}>
        <div style={{ position: 'relative' }}>
          <Textarea rows={5} placeholder="Tell us about yourself — your sport, goals, and what you're looking for…" maxLength={500} value={vals.message} onChange={set('message')} />
          <span style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.72rem', fontFamily: 'DM Sans, sans-serif', color: vals.message.length > 480 ? '#f87171' : 'rgba(168,189,208,0.4)' }}>{vals.message.length}/500</span>
        </div>
      </Field>
      {status === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>Something went wrong. Please try again.</p>}
      <SubmitBtn status={status} />
    </form>
  )
}

// ─── Brand Form ───────────────────────────────────────────────────────────────
function BrandForm({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [vals, setVals] = useState({ brand_name: '', contact_name: '', email: '', industry: '', campaign_type: '', budget_range: '', message: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setVals(v => ({ ...v, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!vals.brand_name) errs.brand_name = 'Required'
    if (!vals.contact_name) errs.contact_name = 'Required'
    if (!vals.email) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Enter a valid email'
    if (!vals.industry) errs.industry = 'Required'
    if (!vals.campaign_type) errs.campaign_type = 'Required'
    if (!vals.budget_range) errs.budget_range = 'Required'
    if (!vals.message) errs.message = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('loading')
    const message = `Brand: ${vals.brand_name}\nIndustry: ${vals.industry}\nCampaign: ${vals.campaign_type}\nBudget: ${vals.budget_range}\n\n${vals.message}`
    const { error } = await supabase.from('inquiries').insert({ name: vals.contact_name, email: vals.email, type: 'brand', message })
    if (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('success')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Brand Name" error={errors.brand_name}><Input placeholder="Nike, Adidas…" value={vals.brand_name} onChange={set('brand_name')} /></Field>
        <Field label="Contact Name" error={errors.contact_name}><Input placeholder="Your full name" value={vals.contact_name} onChange={set('contact_name')} /></Field>
      </div>
      <Field label="Email" error={errors.email}><Input type="email" placeholder="partnerships@brand.com" value={vals.email} onChange={set('email')} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Industry" error={errors.industry}>
          <Select value={vals.industry} onChange={set('industry')}>
            <option value="">Select industry…</option>
            <option>Apparel</option><option>Food &amp; Bev</option><option>Tech</option><option>Financial</option><option>Sports</option><option>Entertainment</option><option>Other</option>
          </Select>
        </Field>
        <Field label="Campaign Type" error={errors.campaign_type}>
          <Select value={vals.campaign_type} onChange={set('campaign_type')}>
            <option value="">Select type…</option>
            <option>Endorsement</option><option>Content</option><option>Appearance</option><option>Sponsorship</option><option>Other</option>
          </Select>
        </Field>
      </div>
      <Field label="Budget Range" error={errors.budget_range}>
        <Select value={vals.budget_range} onChange={set('budget_range')}>
          <option value="">Select range…</option>
          <option>Under $10K</option><option>$10K–$50K</option><option>$50K–$100K</option><option>$100K+</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message}><Textarea rows={5} placeholder="Describe your campaign goals, target athletes, and timeline…" value={vals.message} onChange={set('message')} /></Field>
      {status === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>Something went wrong. Please try again.</p>}
      <SubmitBtn status={status} />
    </form>
  )
}

// ─── Media Form ───────────────────────────────────────────────────────────────
function MediaForm({ onSuccess }: { onSuccess: () => void }) {
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [vals, setVals] = useState({ outlet: '', journalist_name: '', email: '', deadline: '', inquiry_topic: '', message: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setVals(v => ({ ...v, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!vals.outlet) errs.outlet = 'Required'
    if (!vals.journalist_name) errs.journalist_name = 'Required'
    if (!vals.email) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) errs.email = 'Enter a valid email'
    if (!vals.inquiry_topic) errs.inquiry_topic = 'Required'
    if (!vals.message) errs.message = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus('loading')
    const message = `Outlet: ${vals.outlet}\nTopic: ${vals.inquiry_topic}${vals.deadline ? `\nDeadline: ${vals.deadline}` : ''}\n\n${vals.message}`
    const { error } = await supabase.from('inquiries').insert({ name: vals.journalist_name, email: vals.email, type: 'media', message })
    if (error) {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('success')
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Outlet Name" error={errors.outlet}><Input placeholder="ESPN, The Athletic…" value={vals.outlet} onChange={set('outlet')} /></Field>
        <Field label="Journalist Name" error={errors.journalist_name}><Input placeholder="Your name" value={vals.journalist_name} onChange={set('journalist_name')} /></Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Field label="Email" error={errors.email}><Input type="email" placeholder="you@outlet.com" value={vals.email} onChange={set('email')} /></Field>
        <Field label="Deadline (optional)"><Input type="date" value={vals.deadline} onChange={set('deadline')} style={{ colorScheme: 'dark' }} /></Field>
      </div>
      <Field label="Inquiry Topic" error={errors.inquiry_topic}>
        <Select value={vals.inquiry_topic} onChange={set('inquiry_topic')}>
          <option value="">Select topic…</option>
          <option>Athlete Story</option><option>Agency News</option><option>NIL Industry</option><option>Press Release</option><option>Other</option>
        </Select>
      </Field>
      <Field label="Message" error={errors.message}><Textarea rows={5} placeholder="Tell us about your story angle, what you need, and your deadline…" value={vals.message} onChange={set('message')} /></Field>
      {status === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '12px' }}>Something went wrong. Please try again.</p>}
      <SubmitBtn status={status} />
    </form>
  )
}

// ─── Main ContactForm island ───────────────────────────────────────────────────
export default function ContactForm({ initialTab = 'athlete' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [successShown, setSuccessShown] = useState(false)

  const handleSuccess = useCallback(() => {
    setSuccessShown(true)
    setTimeout(() => setSuccessShown(false), 6000)
  }, [])

  const tabs: { key: Tab; label: string }[] = [
    { key: 'athlete', label: 'FOR ATHLETES' },
    { key: 'brand',   label: 'FOR BRANDS'   },
    { key: 'media',   label: 'FOR MEDIA'    },
  ]

  return (
    <>
      <style>{`@keyframes cfSpin { to { transform: rotate(360deg); } }`}</style>

      {successShown && (
        <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: '#22c55e' }}>
          Message received. We'll respond within 48 hours.
        </div>
      )}

      {/* Tab switcher */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(168,189,208,0.12)', marginBottom: '2rem' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t.key ? T.accent : 'rgba(168,189,208,0.5)',
              background: 'transparent', border: 'none',
              borderBottom: tab === t.key ? `2px solid ${T.accent}` : '2px solid transparent',
              padding: '0.75rem 1.25rem', cursor: 'pointer', marginBottom: '-1px',
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div style={{ background: T.surface, border: '1px solid rgba(168,189,208,0.1)', borderRadius: '8px', padding: '2rem' }}>
        {tab === 'athlete' && <AthleteForm key="athlete" onSuccess={handleSuccess} />}
        {tab === 'brand'   && <BrandForm   key="brand"   onSuccess={handleSuccess} />}
        {tab === 'media'   && <MediaForm   key="media"   onSuccess={handleSuccess} />}
      </div>
    </>
  )
}
