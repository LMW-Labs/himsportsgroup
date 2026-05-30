import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL ?? '',
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? '',
)

type View =
  | 'loading'
  | 'admin-pin'
  | 'admin-form'
  | 'admin-link'
  | 'athlete-view'
  | 'athlete-signed'
  | 'not-found'

interface AgreementRow {
  id: string
  athlete_name: string
  effective_date: string
  term_years: number
  agreement_url_token: string
  status: string
}

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

// ─── Shared primitives ────────────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  background:  T.bg,
  border:      `1px solid ${T.border}`,
  color:       T.chrome,
  fontFamily:  'DM Sans, sans-serif',
  padding:     '12px 16px',
  width:       '100%',
  outline:     'none',
  borderRadius: '4px',
  fontSize:    '0.95rem',
  boxSizing:   'border-box',
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
      color: T.silver, fontSize: '0.78rem', letterSpacing: '0.08em',
      textTransform: 'uppercase', marginBottom: '6px',
    }}>
      {children}
    </label>
  )
}

function Field({ label, error, children }: { label?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      {children}
      {error && <p style={{ color: '#f87171', fontSize: '0.75rem', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      style={{ ...inputBase, ...(focused ? { borderColor: T.brand, boxShadow: '0 0 0 3px rgba(26,114,232,0.12)' } : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    />
  )
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      style={{ ...inputBase, cursor: 'pointer', ...(focused ? { borderColor: T.brand } : {}) }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    >
      {children}
    </select>
  )
}

function Btn({ children, variant = 'primary', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  const base: React.CSSProperties = {
    fontFamily:      'Rajdhani, sans-serif',
    fontWeight:      700,
    fontSize:        '0.88rem',
    letterSpacing:   '0.15em',
    textTransform:   'uppercase',
    border:          'none',
    padding:         '13px 32px',
    cursor:          'pointer',
    borderRadius:    '4px',
    transition:      'opacity 150ms, border-color 150ms',
  }
  const styles = variant === 'primary'
    ? { ...base, background: T.brand, color: '#fff' }
    : { ...base, background: 'transparent', color: T.silver, border: `1px solid ${T.border}` }
  return <button style={styles} {...props}>{children}</button>
}

// ─── Shared layout styles ─────────────────────────────────────────────────────
const page: React.CSSProperties   = { padding: '140px 0 80px' }
const wrap: React.CSSProperties   = { maxWidth: 1120, margin: '0 auto', padding: '0 clamp(24px,4vw,96px)' }
const card: React.CSSProperties   = { background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px', padding: '40px', maxWidth: '520px', margin: '0 auto' }
const eyebrow: React.CSSProperties = { fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.32em', color: T.accent, textTransform: 'uppercase', marginBottom: '16px' }
const bigTitle: React.CSSProperties = { fontFamily: 'Bebas Neue, sans-serif', fontSize: '36px', color: T.chrome, lineHeight: 0.95, marginBottom: '12px' }
const bodyText: React.CSSProperties = { fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.silver, lineHeight: 1.7 }

// ─── Agreement content ────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function getAgreementSections(athleteName: string, effectiveDate: string, termYears: number) {
  const d = fmtDate(effectiveDate)
  const t = `${termYears} year${termYears > 1 ? 's' : ''}`
  return [
    {
      title: '1. Purpose and Scope of Representation',
      content: `Agent agrees to represent Athlete exclusively in all matters relating to Athlete's Name, Image, and Likeness ("NIL") rights, including but not limited to negotiating and securing endorsement deals, sponsorships, social media partnerships, merchandise agreements, personal appearances, and other NIL opportunities. Agent shall use commercially reasonable efforts to identify, negotiate, and secure NIL opportunities on Athlete's behalf throughout the Term of this Agreement.`,
    },
    {
      title: '2. Express Limitation to Preserve Eligibility',
      content: `Agent shall NOT negotiate or facilitate: (a) professional sports contracts or agreements with professional teams; (b) draft preparation services or draft-related representation; (c) athletic performance enhancement agreements; (d) compensation tied to professional sports contracts or playing performance; or (e) any service that would constitute representation of Athlete as a professional under applicable NCAA, NAIA, or other governing body regulations. All services provided hereunder are strictly limited to NIL activities permitted under applicable rules and regulations.`,
    },
    {
      title: '3. No Professional Representation',
      content: `This Agreement does not constitute, and shall not be construed as, professional sports representation. Agent is not acting as a player agent, sports agent, or contract advisor as defined under any professional league's collective bargaining agreement or applicable state law governing professional sports agency. Athlete acknowledges that signing this Agreement does not affect, impair, or otherwise impact Athlete's amateur status as it relates to professional sports eligibility.`,
    },
    {
      title: '4. Exclusive NIL Representation',
      content: `During the Term of this Agreement, Athlete grants Agent the exclusive right to represent Athlete in all NIL matters. Athlete shall not engage any other agent, representative, or third party to negotiate, solicit, or finalize NIL deals without Agent's prior written consent. Any NIL deal initiated by Athlete independently during the Term shall be disclosed to Agent, and Agent's commission shall apply to such deal if completed during the Term.`,
    },
    {
      title: '5. Term',
      content: `This Agreement shall commence on ${d} and shall continue for a period of ${t}, unless earlier terminated pursuant to Section 12. Upon expiration, this Agreement shall automatically terminate and shall not renew unless both parties execute a written renewal agreement.`,
    },
    {
      title: '6. Compensation',
      content: `In consideration for Agent's services, Athlete agrees to pay Agent a commission of twenty percent (20%) of the gross value of all NIL compensation received by Athlete during the Term arising from deals arranged by, negotiated by, or through Agent. This commission is not tied to Athlete's athletic performance, playing contracts, scholarship status, or professional draft status. Agent's commission is earned at the time a NIL deal is executed. Athlete shall remit payment to Agent within fifteen (15) days of receipt of NIL compensation.`,
    },
    {
      title: '7. Athlete Approval Required',
      content: `Agent shall not finalize, execute, or commit Athlete to any NIL deal without prior written approval from Athlete. Agent has authority to negotiate terms on Athlete's behalf but Athlete retains exclusive final authority to accept or reject any proposed NIL deal. No deal shall be binding on Athlete unless Athlete has provided written consent (including electronic approval via email or text message).`,
    },
    {
      title: '8. Compliance with Laws and Institutional Policies',
      content: `Both parties agree to comply with all applicable federal, state, and local laws, NCAA rules and bylaws, applicable conference regulations, and the policies and rules of Athlete's educational institution regarding NIL activities. Agent shall review each potential NIL deal for compliance before presenting it to Athlete. If Athlete's institution requires disclosure of NIL deals, Athlete shall be responsible for making such disclosure.`,
    },
    {
      title: '9. No Inducements',
      content: `Agent represents and warrants that no compensation, gift, benefit, or other inducement has been provided or promised, directly or indirectly, to Athlete, Athlete's family members, Athlete's coaches, or any institutional representative in connection with securing or inducing execution of this Agreement. Any violation of this Section shall constitute grounds for immediate termination.`,
    },
    {
      title: '10. Independent Contractor Status',
      content: `Agent is an independent contractor and not an employee of Athlete. Athlete is not an employee of Agent. Neither party shall have the authority to legally bind the other in any contract or obligation except as expressly provided in this Agreement. Agent shall be solely responsible for all taxes, insurance, and other obligations arising from Agent's independent contractor status.`,
    },
    {
      title: '11. Conflict of Interest',
      content: `Agent agrees to promptly disclose to Athlete any actual, potential, or perceived conflict of interest that may arise in connection with Agent's representation of Athlete, including but not limited to representation of competing athletes, relationships with brands or sponsors being solicited on Athlete's behalf, or any financial interest in a potential NIL deal partner. If a conflict arises that cannot be resolved to both parties' satisfaction, either party may terminate this Agreement pursuant to Section 12.`,
    },
    {
      title: '12. Termination',
      content: `(a) Either party may terminate this Agreement at any time upon thirty (30) days' prior written notice to the other party. During the notice period, Agent's obligations to pursue NIL opportunities shall continue unless otherwise agreed. (b) Either party may terminate this Agreement immediately upon written notice in the event of a material breach by the other party that is not cured within ten (10) calendar days of written notice of such breach. (c) Either party may terminate this Agreement immediately and without notice if continuation of the Agreement would jeopardize Athlete's athletic eligibility or violate applicable NCAA, conference, or institutional regulations. Termination shall not relieve Athlete of the obligation to pay commissions on deals completed prior to the effective date of termination.`,
    },
    {
      title: '13. No Guarantee of Compensation',
      content: `Agent does not guarantee that Athlete will receive any minimum level of NIL compensation, that any specific NIL deals will be secured during the Term, or that any particular brand or sponsor will enter into a deal with Athlete. Agent's obligations under this Agreement are limited to good-faith, commercially reasonable efforts to identify, solicit, and negotiate NIL opportunities consistent with Athlete's profile, eligibility, and institutional requirements.`,
    },
    {
      title: '14. Governing Law',
      content: `This Agreement shall be governed by and construed in accordance with the laws of the State of Mississippi, without regard to its conflict of law principles. Any disputes, controversies, or claims arising under or in connection with this Agreement shall be submitted to binding arbitration in the State of Mississippi under applicable arbitration rules, or if arbitration is not agreed to, resolved exclusively in the courts of competent jurisdiction in the State of Mississippi.`,
    },
    {
      title: '15. Entire Agreement',
      content: `This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, warranties, understandings, and agreements between the parties, whether oral or written. No modification, amendment, or waiver of any provision of this Agreement shall be valid or binding unless made in writing and signed by both parties.`,
    },
    {
      title: '16. Eligibility Protection Clause',
      content: `Notwithstanding any other provision of this Agreement, Agent's representation of Athlete shall at all times give paramount priority to the preservation of Athlete's athletic eligibility. In the event that any action taken or proposed to be taken pursuant to this Agreement would or could jeopardize Athlete's eligibility under applicable NCAA, conference, or institutional rules, such action shall be immediately suspended pending review. If the action is determined to threaten eligibility, this Agreement shall be subject to immediate termination pursuant to Section 12(c) and Agent shall have no claim for damages arising from such termination.`,
    },
    {
      title: '17. Acknowledgment',
      content: `By signing below, Athlete acknowledges and agrees that: (a) Athlete has had adequate time and opportunity to read and review this Agreement in full; (b) Athlete has had the opportunity to seek independent legal counsel prior to signing and has either done so or knowingly waived that right; (c) Athlete fully understands the terms, conditions, rights, and obligations set forth in this Agreement; (d) Athlete is entering into this Agreement voluntarily, freely, and of Athlete's own accord, without duress or coercion; (e) this Agreement is limited exclusively to NIL representation and does not constitute professional sports representation; and (f) Athlete is of legal age or has obtained parental or guardian consent if required by applicable law.`,
    },
  ]
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NILAgreement() {
  const [view, setView]                     = useState<View>('loading')
  const [pin, setPin]                       = useState('')
  const [pinError, setPinError]             = useState(false)
  const [adminForm, setAdminForm]           = useState({ athleteName: '', effectiveDate: '', termYears: '1' })
  const [submittingAdmin, setSubmittingAdmin] = useState(false)
  const [adminError, setAdminError]         = useState('')
  const [agreement, setAgreement]           = useState<AgreementRow | null>(null)
  const [signingLink, setSigningLink]       = useState('')
  const [copied, setCopied]                 = useState(false)
  const [token, setToken]                   = useState('')
  const [athleteEmail, setAthleteEmail]     = useState('')
  const [hasRead, setHasRead]               = useState(false)
  const [signMode, setSignMode]             = useState<'draw' | 'type'>('draw')
  const [typedName, setTypedName]           = useState('')
  const [isSubmitting, setIsSubmitting]     = useState(false)
  const [submitError, setSubmitError]       = useState('')
  const [justSigned, setJustSigned]         = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos   = useRef({ x: 0, y: 0 })

  // Load jsPDF from CDN on mount
  useEffect(() => {
    if ((window as any).jspdf) return
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    document.head.appendChild(script)
  }, [])

  // Detect view from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tok = params.get('token')
    if (tok) {
      setToken(tok)
      loadAgreement(tok)
    } else {
      setView('admin-pin')
    }
  }, [])

  // Render typed name onto canvas
  useEffect(() => {
    if (signMode !== 'type' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!typedName) return
    ctx.fillStyle = T.brand
    ctx.font = 'italic 44px Georgia, serif'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2)
  }, [typedName, signMode])

  async function loadAgreement(tok: string) {
    const { data, error } = await supabase
      .from('nil_agreements')
      .select('*')
      .eq('agreement_url_token', tok)
      .single()
    if (error || !data) { setView('not-found'); return }
    setAgreement(data)
    setView(data.status === 'signed' ? 'athlete-signed' : 'athlete-view')
  }

  function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const adminPin = import.meta.env.PUBLIC_ADMIN_PIN
    if (!adminPin) { setPinError(true); return }
    if (pin === adminPin) { setView('admin-form'); setPinError(false) }
    else setPinError(true)
  }

  async function handleAdminSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmittingAdmin(true)
    setAdminError('')
    const { data, error } = await supabase
      .from('nil_agreements')
      .insert({ athlete_name: adminForm.athleteName, effective_date: adminForm.effectiveDate, term_years: parseInt(adminForm.termYears) })
      .select('agreement_url_token')
      .single()
    setSubmittingAdmin(false)
    if (error || !data) { setAdminError('Failed to create agreement. Please try again.'); return }
    setSigningLink(`${window.location.origin}/nil-agreement?token=${data.agreement_url_token}`)
    setView('admin-link')
  }

  // ── Canvas helpers ──
  function getPos(canvas: HTMLCanvasElement, clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    }
  }

  function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.beginPath()
    ctx.arc(x, y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = T.brand
    ctx.fill()
  }

  function drawLine(ctx: CanvasRenderingContext2D, from: { x: number; y: number }, to: { x: number; y: number }) {
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.strokeStyle = T.brand
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (signMode !== 'draw') return
    isDrawing.current = true
    const pos = getPos(canvasRef.current!, e.clientX, e.clientY)
    lastPos.current = pos
    drawDot(canvasRef.current!.getContext('2d')!, pos.x, pos.y)
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || signMode !== 'draw') return
    const pos = getPos(canvasRef.current!, e.clientX, e.clientY)
    drawLine(canvasRef.current!.getContext('2d')!, lastPos.current, pos)
    lastPos.current = pos
  }

  function stopDrawing() { isDrawing.current = false }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (signMode !== 'draw') return
    isDrawing.current = true
    lastPos.current = getPos(canvasRef.current!, e.touches[0].clientX, e.touches[0].clientY)
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawing.current || signMode !== 'draw') return
    const pos = getPos(canvasRef.current!, e.touches[0].clientX, e.touches[0].clientY)
    drawLine(canvasRef.current!.getContext('2d')!, lastPos.current, pos)
    lastPos.current = pos
  }

  function clearCanvas() {
    if (!canvasRef.current) return
    canvasRef.current.getContext('2d')!.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setTypedName('')
  }

  function isCanvasEmpty() {
    if (!canvasRef.current) return true
    return !Array.from(canvasRef.current.getContext('2d')!.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height).data).some(v => v !== 0)
  }

  // ── Athlete submission ──
  async function handleAthleteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasRead) { setSubmitError('Please check the acknowledgment checkbox.'); return }
    if (isCanvasEmpty()) { setSubmitError('Please provide your signature before submitting.'); return }

    setIsSubmitting(true)
    setSubmitError('')

    const signatureData = canvasRef.current!.toDataURL('image/png')

    let ip = 'unknown'
    try {
      const r = await fetch('https://api.ipify.org?format=json')
      ip = (await r.json()).ip
    } catch {}

    const payload: Record<string, unknown> = {
      signature_data: signatureData,
      signed_at:      new Date().toISOString(),
      ip_address:     ip,
      status:         'signed',
    }
    if (athleteEmail) payload.athlete_email = athleteEmail

    const { error: updateError } = await supabase
      .from('nil_agreements')
      .update(payload)
      .eq('agreement_url_token', token)
      .eq('status', 'pending')

    if (updateError) {
      setIsSubmitting(false)
      setSubmitError('Submission failed. Please try again.')
      return
    }

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteName: agreement!.athlete_name, signedAt: new Date().toISOString(), athleteEmail: athleteEmail || null }),
      })
    } catch {}

    setIsSubmitting(false)
    setJustSigned(true)
    setView('athlete-signed')
  }

  // ── PDF generation ──
  function generatePDF() {
    const jspdf = (window as any).jspdf
    if (!jspdf) {
      window.print()
      return
    }
    const { jsPDF } = jspdf
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const W      = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxW   = W - margin * 2
    let y        = 20

    const checkY = (needed: number) => { if (y + needed > 270) { doc.addPage(); y = 20 } }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('EXCLUSIVE NIL REPRESENTATION AGREEMENT', W / 2, y, { align: 'center' })
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Hyche International Management Sports Group', W / 2, y, { align: 'center' })
    y += 5
    doc.text(`Athlete: ${agreement!.athlete_name}   |   Agent: Christopher Hyche   |   Date: ${fmtDate(agreement!.effective_date)}`, W / 2, y, { align: 'center' })
    y += 5
    doc.setDrawColor(26, 114, 232)
    doc.line(margin, y, W - margin, y)
    y += 7

    for (const s of getAgreementSections(agreement!.athlete_name, agreement!.effective_date, agreement!.term_years)) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      const tLines = doc.splitTextToSize(s.title, maxW)
      checkY(tLines.length * 5 + 2)
      doc.text(tLines, margin, y)
      y += tLines.length * 5 + 2

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      const bLines = doc.splitTextToSize(s.content, maxW)
      checkY(bLines.length * 4.5)
      doc.text(bLines, margin, y)
      y += bLines.length * 4.5 + 5
    }

    checkY(50)
    doc.setDrawColor(180, 180, 180)
    doc.line(margin, y, W - margin, y)
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('SIGNATURES', margin, y)
    y += 8

    if (canvasRef.current) {
      const sigImg = canvasRef.current.toDataURL('image/png')
      doc.addImage(sigImg, 'PNG', margin, y, 80, 24)
      y += 28
    }
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`${agreement!.athlete_name} — Athlete`, margin, y)
    y += 5
    doc.text(`Signed: ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CST`, margin, y)
    y += 5
    doc.text('Christopher Hyche — Agent, Hyche International Management Sports Group', margin, y)

    doc.save(`NIL-Agreement-${agreement!.athlete_name.replace(/\s+/g, '-')}.pdf`)
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // Views
  // ═════════════════════════════════════════════════════════════════════════════

  if (view === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', color: T.silver, letterSpacing: '0.3em', fontSize: '0.85rem' }}>LOADING…</p>
      </div>
    )
  }

  if (view === 'admin-pin') {
    return (
      <section style={page}>
        <div style={wrap}>
          <div style={card}>
            <p style={eyebrow}>Admin Access</p>
            <h1 style={bigTitle}>ADMIN PANEL</h1>
            <p style={{ ...bodyText, marginBottom: '28px' }}>Enter your PIN to generate an athlete signing link.</p>
            <form onSubmit={handlePinSubmit}>
              <Field label="Admin PIN" error={pinError ? 'Incorrect PIN. Contact Christopher Hyche.' : undefined}>
                <Input type="password" value={pin} onChange={e => { setPin(e.target.value); setPinError(false) }} placeholder="Enter PIN" autoFocus required />
              </Field>
              <Btn type="submit">Continue →</Btn>
            </form>
          </div>
        </div>
      </section>
    )
  }

  if (view === 'admin-form') {
    return (
      <section style={page}>
        <div style={wrap}>
          <div style={card}>
            <p style={eyebrow}>New Agreement</p>
            <h1 style={bigTitle}>CREATE AGREEMENT</h1>
            <p style={{ ...bodyText, marginBottom: '28px' }}>Enter athlete details to generate a unique, single-use signing link.</p>
            <form onSubmit={handleAdminSubmit}>
              <Field label="Athlete Full Name">
                <Input type="text" value={adminForm.athleteName} onChange={e => setAdminForm(f => ({ ...f, athleteName: e.target.value }))} placeholder="e.g. Marcus Williams" required />
              </Field>
              <Field label="Effective Date">
                <Input type="date" value={adminForm.effectiveDate} onChange={e => setAdminForm(f => ({ ...f, effectiveDate: e.target.value }))} style={{ ...inputBase, colorScheme: 'dark' }} required />
              </Field>
              <Field label="Agreement Term">
                <Select value={adminForm.termYears} onChange={e => setAdminForm(f => ({ ...f, termYears: e.target.value }))}>
                  <option value="1">1 Year</option>
                  <option value="2">2 Years</option>
                </Select>
              </Field>
              {adminError && <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '16px' }}>{adminError}</p>}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Btn type="submit" disabled={submittingAdmin}>{submittingAdmin ? 'Generating…' : 'Generate Link →'}</Btn>
                <Btn type="button" variant="ghost" onClick={() => setView('admin-pin')}>Back</Btn>
              </div>
            </form>
          </div>
        </div>
      </section>
    )
  }

  if (view === 'admin-link') {
    return (
      <section style={page}>
        <div style={wrap}>
          <div style={{ ...card, maxWidth: '640px' }}>
            <p style={eyebrow}>Agreement Ready</p>
            <h1 style={bigTitle}>SIGNING LINK GENERATED</h1>
            <p style={{ ...bodyText, marginBottom: '24px' }}>
              Copy this link and send it to the athlete. It is unique and expires once signed.
            </p>
            <div style={{
              background:    T.bg,
              border:        `1px solid ${T.border}`,
              borderRadius:  '4px',
              padding:       '14px 16px',
              marginBottom:  '20px',
              wordBreak:     'break-all',
              fontFamily:    'DM Sans, sans-serif',
              fontSize:      '13px',
              color:         T.brand,
            }}>
              {signingLink}
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Btn type="button" onClick={() => { navigator.clipboard.writeText(signingLink); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Btn>
              <Btn type="button" variant="ghost" onClick={() => { setAdminForm({ athleteName: '', effectiveDate: '', termYears: '1' }); setSigningLink(''); setView('admin-form') }}>
                Create Another
              </Btn>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (view === 'athlete-signed') {
    return (
      <section style={page}>
        <div style={wrap}>
          <div style={{ ...card, maxWidth: '560px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', color: T.brand, marginBottom: '16px', lineHeight: 1 }}>✓</div>
            <p style={eyebrow}>Signature Recorded</p>
            <h1 style={bigTitle}>AGREEMENT SIGNED</h1>
            <p style={{ ...bodyText, margin: '16px 0 28px' }}>
              {agreement?.athlete_name
                ? `${agreement.athlete_name}, your NIL Representation Agreement with Hyche International Management Sports Group has been signed and recorded. Christopher Hyche will be in touch shortly.`
                : 'This agreement has already been signed.'}
            </p>
            {justSigned && (
              <Btn type="button" onClick={generatePDF}>Download PDF Copy</Btn>
            )}
          </div>
        </div>
      </section>
    )
  }

  if (view === 'not-found' || !agreement) {
    return (
      <section style={page}>
        <div style={wrap}>
          <div style={{ ...card, textAlign: 'center' }}>
            <p style={eyebrow}>Not Found</p>
            <h1 style={bigTitle}>INVALID LINK</h1>
            <p style={{ ...bodyText, marginTop: '16px' }}>
              This signing link is invalid or has already been used. Contact Christopher Hyche for assistance.
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ── Athlete signing view ──────────────────────────────────────────────────
  const sections = getAgreementSections(agreement.athlete_name, agreement.effective_date, agreement.term_years)

  return (
    <section style={{ padding: '120px 0 80px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '0 clamp(24px,4vw,48px)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <p style={eyebrow}>NIL Representation</p>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(26px,4vw,44px)', color: T.chrome, lineHeight: 0.95, marginBottom: '16px' }}>
            EXCLUSIVE NIL REPRESENTATION AGREEMENT
          </h1>
          <p style={bodyText}>
            Between{' '}
            <strong style={{ color: T.chrome }}>{agreement.athlete_name}</strong>
            {' '}(Athlete) and{' '}
            <strong style={{ color: T.chrome }}>Christopher Hyche</strong>
            {', '}Hyche International Management Sports Group (Agent)
          </p>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', color: T.silver, fontSize: '0.75rem', letterSpacing: '0.12em', marginTop: '8px' }}>
            EFFECTIVE: {fmtDate(agreement.effective_date).toUpperCase()}
            {' · '}TERM: {agreement.term_years} YEAR{agreement.term_years > 1 ? 'S' : ''}
            {' · '}COMPENSATION: 20% GROSS NIL
            {' · '}GOVERNED BY LAWS OF MISSISSIPPI
          </p>
        </div>

        {/* Agreement scroll box */}
        <div style={{
          background:    T.surface,
          border:        `1px solid ${T.borderFaint}`,
          borderRadius:  '6px',
          padding:       '32px',
          marginBottom:  '24px',
          maxHeight:     '500px',
          overflowY:     'auto',
        }}>
          {sections.map(section => (
            <div key={section.title} style={{ marginBottom: '28px' }}>
              <h3 style={{
                fontFamily:    'Rajdhani, sans-serif',
                fontWeight:    700,
                fontSize:      '0.85rem',
                letterSpacing: '0.06em',
                color:         T.chrome,
                textTransform: 'uppercase',
                marginBottom:  '8px',
              }}>
                {section.title}
              </h3>
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13.5px', color: T.silver, lineHeight: 1.8 }}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Signing form */}
        <form onSubmit={handleAthleteSubmit}>

          {/* Email + checkbox */}
          <div style={{ background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px', padding: '28px 32px', marginBottom: '16px' }}>
            <Field label="Your Email (optional — for a confirmation copy)">
              <Input type="email" value={athleteEmail} onChange={e => setAthleteEmail(e.target.value)} placeholder="athlete@email.com" />
            </Field>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasRead}
                onChange={e => setHasRead(e.target.checked)}
                style={{ marginTop: '3px', accentColor: T.brand, width: '16px', height: '16px', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '14px', color: T.silver, lineHeight: 1.65 }}>
                I have read and understand the Exclusive NIL Representation Agreement in its entirety, and I agree to be bound by its terms and conditions.
              </span>
            </label>
          </div>

          {/* Signature panel */}
          <div style={{ background: T.surface, border: `1px solid ${T.borderFaint}`, borderRadius: '6px', padding: '28px 32px', marginBottom: '24px' }}>
            <p style={{ ...eyebrow, marginBottom: '20px' }}>Your Signature</p>

            {/* Draw / Type tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {(['draw', 'type'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => { setSignMode(mode); clearCanvas() }}
                  style={{
                    fontFamily:    'Rajdhani, sans-serif',
                    fontWeight:    600,
                    fontSize:      '0.8rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding:       '8px 20px',
                    borderRadius:  '4px',
                    border:        `1px solid ${signMode === mode ? T.brand : T.border}`,
                    background:    signMode === mode ? 'rgba(26,114,232,0.12)' : 'transparent',
                    color:         signMode === mode ? T.brand : T.silver,
                    cursor:        'pointer',
                    transition:    'all 150ms',
                  }}
                >
                  {mode === 'draw' ? 'Draw' : 'Type Name'}
                </button>
              ))}
            </div>

            {signMode === 'type' && (
              <div style={{ marginBottom: '12px' }}>
                <Input type="text" value={typedName} onChange={e => setTypedName(e.target.value)} placeholder="Type your full name to sign" />
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={760}
              height={160}
              style={{
                display:      'block',
                width:        '100%',
                height:       '160px',
                background:   '#060810',
                border:       `1px solid ${T.border}`,
                borderRadius: '4px',
                cursor:       signMode === 'draw' ? 'crosshair' : 'default',
                touchAction:  'none',
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={stopDrawing}
            />

            {signMode === 'draw' && (
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(168,189,208,0.45)', marginTop: '8px' }}>
                Draw your signature above with your mouse or finger
              </p>
            )}

            <button
              type="button"
              onClick={clearCanvas}
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.silver, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', opacity: 0.6, marginTop: '4px' }}
            >
              Clear
            </button>
          </div>

          {submitError && (
            <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '16px' }}>{submitError}</p>
          )}

          <Btn type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Sign & Submit Agreement →'}
          </Btn>

          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: 'rgba(168,189,208,0.4)', marginTop: '16px', lineHeight: 1.65 }}>
            By clicking Sign &amp; Submit, your electronic signature will be recorded along with your IP address and timestamp as a legally binding acknowledgment of this Agreement under applicable electronic signature laws.
          </p>
        </form>
      </div>
    </section>
  )
}
