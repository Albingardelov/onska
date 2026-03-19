export const FINT_STATUSES = [
  'behover_omtanke',
  'vill_vara_nara',
  'lugn_kvall',
  'pa_bra_humor',
] as const

export const SNUSK_STATUSES = [
  'kanner_sig_vild',
  'nyfiken',
  'laddad',
  'behover_distraktion',
] as const

export type StatusKey =
  | (typeof FINT_STATUSES)[number]
  | (typeof SNUSK_STATUSES)[number]

export const ALL_STATUS_KEYS: readonly string[] = [...FINT_STATUSES, ...SNUSK_STATUSES]

export function getStatusesForMode(mode: 'fint' | 'snusk') {
  return mode === 'snusk' ? SNUSK_STATUSES : FINT_STATUSES
}

export function isValidStatusKey(value: string | null | undefined): value is StatusKey {
  return !!value && ALL_STATUS_KEYS.includes(value)
}
