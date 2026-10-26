/**
 * Utilitários de data seguros no backend para ordenações e cálculos de agendamento.
 */

export function safeDate(date: string | Date | number | null | undefined): Date | null {
  if (!date) return null
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date
  }
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? null : parsed
}

export function safeGetTime(date: string | Date | number | null | undefined): number {
  if (!date) return 0
  if (date instanceof Date) {
    const t = date.getTime()
    return isNaN(t) ? 0 : t
  }
  const parsed = new Date(date).getTime()
  return isNaN(parsed) ? 0 : parsed
}

export function safeSortDesc<T>(
  items: T[],
  getDate: (item: T) => string | Date | number | null | undefined,
): T[] {
  return [...items].sort((a, b) => safeGetTime(getDate(b)) - safeGetTime(getDate(a)))
}

export function safeSortAsc<T>(
  items: T[],
  getDate: (item: T) => string | Date | number | null | undefined,
): T[] {
  return [...items].sort((a, b) => safeGetTime(getDate(a)) - safeGetTime(getDate(b)))
}
