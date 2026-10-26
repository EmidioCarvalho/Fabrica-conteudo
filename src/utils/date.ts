/**
 * Utilitários de data seguros para ordenações e formatações no frontend.
 * Previne exceções do tipo 'a.createdAt.getTime is not a function' quando datas vêm como strings ISO da API.
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

export function formatDateSafe(
  date: string | Date | null | undefined,
  fallback = '—',
  locale = 'pt-BR',
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = safeDate(date)
  if (!d) return fallback
  return d.toLocaleDateString(locale, options || { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTimeSafe(
  date: string | Date | null | undefined,
  fallback = '—',
  locale = 'pt-BR',
): string {
  const d = safeDate(date)
  if (!d) return fallback
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
