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
