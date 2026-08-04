const prefix = 'viztto:'

export const storageKeys = {
  auth: `${prefix}auth`,
  workspace: `${prefix}workspace`,
  onboarding: `${prefix}onboarding`,
  clients: `${prefix}clients`,
  projects: `${prefix}projects`,
  team: `${prefix}team`,
  materials: `${prefix}materials`,
  materialVersions: `${prefix}material-versions`,
  comments: `${prefix}comments`,
  approvals: `${prefix}approvals`,
  activities: `${prefix}activities`,
  notifications: `${prefix}notifications`,
  preferences: `${prefix}preferences`,
  schemaVersion: `${prefix}schema-version`,
} as const

export const localStorageService = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : fallback
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // A interface continua funcional durante falhas de armazenamento.
    }
  },
  remove(key: string) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
  },
  reset() {
    if (typeof window === 'undefined') return
    Object.values(storageKeys).forEach((key) => window.localStorage.removeItem(key))
  },
}
