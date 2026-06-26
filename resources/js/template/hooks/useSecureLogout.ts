import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Every localStorage key that stores auth or user-session data. */
const LOCAL_STORAGE_KEYS = ['token', 'auth_token', 'user'] as const

/** Every sessionStorage key written by this SPA. */
const SESSION_STORAGE_KEYS = ['kenfinly_settings_return'] as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecureLogoutOptions {
  /**
   * Skip the backend /auth/logout call.
   * Use when the token has already been revoked server-side (e.g. after a
   * successful deactivate/delete API call that invalidated the JWT).
   */
  skipApiCall?: boolean
}

export interface UseSecureLogoutReturn {
  logout: (options?: SecureLogoutOptions) => Promise<void>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useSecureLogout
 *
 * Centralises the full logout cleanup lifecycle required by OWASP standards:
 *
 *  1. Revokes the JWT on the server via POST /api/auth/logout (best-effort —
 *     never blocks client-side cleanup even if the call fails).
 *  2. Wipes every auth key from localStorage and sessionStorage to prevent
 *     data leakage across sessions.
 *  3. Hard-redirects to /SignIn using history.replace so the browser's Back
 *     button cannot return the user to any authenticated screen.
 *
 * Use this hook in every logout / account-deactivation / account-deletion flow.
 * Never call navigate('/SignIn') directly — always go through this hook.
 */
export function useSecureLogout(): UseSecureLogoutReturn {
  const navigate = useNavigate()

  const logout = useCallback(async (options: SecureLogoutOptions = {}) => {
    // ── 1. Server-side token revocation ──────────────────────────────────────
    if (!options.skipApiCall) {
      try {
        await api.post('/auth/logout')
      } catch {
        // Token may already be expired or invalid.
        // Client-side cleanup below is the authoritative step.
      }
    }

    // ── 2. Wipe all client-side auth state ───────────────────────────────────
    LOCAL_STORAGE_KEYS.forEach(key => localStorage.removeItem(key))
    SESSION_STORAGE_KEYS.forEach(key => sessionStorage.removeItem(key))

    // ── 3. Hard redirect — replace so Back cannot revisit protected pages ────
    navigate('/SignIn', { replace: true })
  }, [navigate])

  return { logout }
}
