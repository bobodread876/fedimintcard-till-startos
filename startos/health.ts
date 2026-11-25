/** Setup is available on the admin listener before the wallet serves the POS API. */
export async function adminPhase(
  port: number,
  password: string | null | undefined,
  request: typeof fetch = fetch,
): Promise<
  | 'setup'
  | 'joining'
  | 'opening'
  | 'retrying'
  | 'unsupported'
  | 'ready'
  | 'auth'
  | 'unavailable'
  | 'no-password'
> {
  const credential = password?.trim()
  try {
    if (!credential) {
      const health = await request(`http://127.0.0.1:${port}/healthz`, {
        redirect: 'error',
        signal: AbortSignal.timeout(5_000),
      })
      return health.ok ? 'no-password' : 'unavailable'
    }
    const response = await request(`http://127.0.0.1:${port}/admin/status`, {
      headers: { authorization: `Bearer ${credential}` },
      redirect: 'error',
      signal: AbortSignal.timeout(5_000),
    })
    if (response.status === 401 || response.status === 403) return 'auth'
    if (!response.ok) return 'unavailable'
    const body = await response.json()
    if (typeof body.joined !== 'boolean') return 'unavailable'
    if (body.joined) return 'ready'
    if (body.setup_error) return 'unsupported'
    if (body.joining) return 'joining'
    if (body.retrying_mint) return 'retrying'
    if (body.starting) return 'opening'
    return 'setup'
  } catch {
    return 'unavailable'
  }
}
