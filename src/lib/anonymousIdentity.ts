const FINGERPRINT_KEY = 'eotc_user_fingerprint_v1'

export function getUserFingerprint(): string {
  const existing = localStorage.getItem(FINGERPRINT_KEY)
  if (existing) {
    return existing
  }

  const nextFingerprint = crypto.randomUUID()
  localStorage.setItem(FINGERPRINT_KEY, nextFingerprint)
  return nextFingerprint
}
