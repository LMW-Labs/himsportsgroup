// ─── SITE-WIDE DATA ──────────────────────────────────────────────────────────
// Single source of truth for brand data, founder info, values, stats, and services.

export interface SocialLinks {
  instagram: string
  twitter: string
  tiktok: string
  youtube: string
  linkedin: string
}

export interface SiteConfig {
  name: string
  shortName: string
  tagline: string
  location: string
  email: string
  social: SocialLinks
}

export const site: SiteConfig = {
  name: 'Hyche International Management Sports Group',
  shortName: 'HIM Sports Group',
  tagline: 'Your Name. Your Brand. Your Future.',
  location: 'Jackson, MS · Nationwide',
  email: 'contact@himsportsgroup.com', // placeholder
  social: {
    instagram: '#',
    twitter: '#',
    tiktok: '#',
    youtube: '#',
    linkedin: '#',
  },
}


// ─── FOUNDER ─────────────────────────────────────────────────────────────────

export interface FounderCredential {
  label: string
  sublabel: string
}

export interface FounderTimelineEntry {
  year: string
  event: string
}

export interface Founder {
  name: string
  title: string
  photoUrl: string
  initials: string
  headline: string
  bio: string
  credentials: FounderCredential[]
  timeline: FounderTimelineEntry[]
  uniqueAngle: string
}

export const founder: Founder = {
  name: 'Chris Hyche',
  title: 'Founder & CEO',
  photoUrl: '/assets/hyche_portrait.png',
  initials: 'CH',
  headline: 'Jackson, Mississippi native. Former Harlem Globetrotter. Built for the next generation.',
  bio: `Chris Hyche is a Jackson, Mississippi native who built his career the way he now builds his clients' — through discipline, relationships, and a refusal to take shortcuts. A former Dandy Dozen honoree at Provine High School, he played college basketball at Jackson State University before finishing his eligibility at Talladega College.

After college, Chris took his game international — playing professionally in Mexico, Kosovo, and Morocco before joining the Jackson Showboats of the ABA. In 2018, he became a Harlem Globetrotter, performing across 38 states and more than 26 countries under the stage name "Animal."

That global stage gave him something most agents never experience — a real understanding of what it means to build a brand, connect with audiences, and represent something bigger than yourself. It's the foundation Hyche International Management Sports Group is built on today.`,
  credentials: [
    { label: '26+', sublabel: 'Countries Played' },
    { label: '38+', sublabel: 'States Traveled' },
    { label: '4',   sublabel: 'Pro Leagues' },
    { label: '2018', sublabel: 'Joined Globetrotters' },
  ],
  timeline: [
    { year: '2007',  event: 'Enrolled at Jackson State University' },
    { year: '2012',  event: 'Completed college eligibility at Talladega College' },
    { year: '2013',  event: 'Began professional career — Jackson Showboats (ABA)' },
    { year: '2014',  event: 'International professional play — Mexico, Kosovo, Morocco' },
    { year: '2018',  event: 'Joined the Harlem Globetrotters as "Animal"' },
    { year: '2018+', event: 'Toured 38+ states and 26+ countries worldwide' },
    { year: '2024',  event: 'Founded Hyche International Management Sports Group in Jackson, MS' },
  ],
  uniqueAngle:
    'Grew up with deaf parents. Native ASL speaker. Active in deaf community outreach and anti-bullying programs nationwide. Understands communication across barriers at a level most agents never encounter.',
}


// ─── VALUES ──────────────────────────────────────────────────────────────────

export interface Value {
  number: string
  title: string
  desc: string
}

export const values: Value[] = [
  {
    number: '01',
    title: 'Integrity',
    desc: "We tell athletes the truth, even when it's not what they want to hear. Honest counsel builds careers that last.",
  },
  {
    number: '02',
    title: 'Boutique Attention',
    desc: 'Every athlete on our roster gets direct access to leadership. No assistants, no hand-offs — just real representation.',
  },
  {
    number: '03',
    title: 'Long-Term Vision',
    desc: 'We turn down short-term deals that compromise long-term brand equity. Career arcs matter more than one-time paydays.',
  },
  {
    number: '04',
    title: 'Entertainment Network',
    desc: "Our roots in global entertainment open doors that pure sports agencies simply can't. Culture is our currency.",
  },
]


// ─── STATS ───────────────────────────────────────────────────────────────────

export interface Stat {
  value: string
  label: string
  numeric: number
  prefix?: string
  suffix?: string
}

export const stats: Stat[] = [
  { value: '50+',  label: 'Athletes Represented', numeric: 50 },
  { value: '26+',  label: 'Countries',             numeric: 26 },
  { value: '38+',  label: 'States',                numeric: 38 },
  { value: '$2M+', label: 'NIL Value Secured',     numeric: 2, prefix: '$', suffix: 'M+' },
]


// ─── SERVICES ────────────────────────────────────────────────────────────────

export interface Service {
  title: string
  body: string
}

export const services: Service[] = [
  {
    title: 'NIL REPRESENTATION',
    body: 'Negotiate NIL deals, collective agreements, and brand partnerships for collegiate athletes. We maximize value without compromising eligibility or reputation.',
  },
  {
    title: 'CONTRACT NEGOTIATION',
    body: 'From the first professional offer to multi-year extensions, we protect your interests at every stage of your career.',
  },
  {
    title: 'BRAND ARCHITECTURE',
    body: 'Your name is a business. We help you build it — identity, partnerships, media presence, and long-term equity.',
  },
]
