import { like, not, type SQL } from 'drizzle-orm'
import { workspaces } from '../banco/esquema/index.js'

/** Workspaces criados pelos testes E2E (slug `e2e-...`) não devem poluir o switch admin. */
export function naoEhWorkspaceDeTeste(): SQL {
  return not(like(workspaces.slug, 'e2e-%'))
}
