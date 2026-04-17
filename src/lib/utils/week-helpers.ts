export function getMondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay() // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
