export function parsePlayerMessage(text) {
  const match = text.match(/add\s+player\s*:\s*(.+)/i)
  if (!match) return null

  const parts = match[1].split(',').map(s => s.trim()).filter(Boolean)
  if (parts.length < 4) return null

  return {
    name: parts[0],
    school: parts[1],
    position: parts[2].toUpperCase(),
    classYear: parts[3]
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
