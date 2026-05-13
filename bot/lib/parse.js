const VALID_AVAILABILITY = ['available', 'signed']

export function parsePlayerMessage(text) {
  const match = text.match(/add\s+player\s*:\s*(.+)/i)
  if (!match) return null

  const parts = match[1].split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 4) return null

  const rawAvailability = (parts[4] ?? 'available').toLowerCase()
  const availability = VALID_AVAILABILITY.includes(rawAvailability) ? rawAvailability : 'available'

  return {
    name: parts[0],
    school: parts[1],
    position: parts[2].toUpperCase(),
    classYear: parts[3],
    availability,
  }
}

export function parseNameCommand(prefix, text) {
  const re = new RegExp(`^${prefix}\\s*:\\s*(.+)`, 'i')
  const match = text.match(re)
  return match ? match[1].trim() : null
}

export function parseUpdateCommand(text) {
  const match = text.match(/^update\s+player\s*:\s*(.+?)\s*\|\s*(.+?)\s*:\s*(.+)/i)
  if (!match) return null
  return { name: match[1].trim(), field: match[2].trim(), value: match[3].trim() }
}

export function parseListCommand(text) {
  const match = text.match(/^list\s+players?\s*(?::\s*(.+))?$/i)
  if (!match) return null
  return { school: match[1]?.trim() ?? null }
}

export function parseBulkRoster(text) {
  const headerMatch = text.match(/^roster\s*(?:update)?\s*:\s*\n([\s\S]+)/i)
  if (!headerMatch) return null

  const rows = []
  const lines = headerMatch[1].split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim()).filter(Boolean)
    if (parts.length < 3) continue

    const name = parts[0]
    const position = parts[1]
    const school = parts[2]
    const rawAvail = (parts[3] ?? 'available').toLowerCase()
    const availability = ['available', 'signed'].includes(rawAvail) ? rawAvail : 'available'
    const height = parts[4]?.trim() || null

    rows.push({ name, position, school, availability, height })
  }

  return rows.length > 0 ? rows : null
}
