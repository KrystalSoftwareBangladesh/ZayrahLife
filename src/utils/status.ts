export function normalizeStatusValue(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

export function statusValuesMatch(left: unknown, right: unknown): boolean {
  return normalizeStatusValue(left) === normalizeStatusValue(right)
}

export function humanizeStatusLabel(value: unknown): string {
  const normalized = normalizeStatusValue(value).toLowerCase()
  if (!normalized) return 'Unknown'

  return normalized
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
