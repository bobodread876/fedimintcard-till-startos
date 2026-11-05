import { storeJson } from './fileModels/store.json'
import { posToken } from './fileModels/tillFiles'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { dataDir, defaultRegistryUrl, tillCli, tillPort } from './utils'

/** What `GET /v1/status` answers (fedimintcard docs/TILL-API.md), the parts the checks read. */
type TillStatus = {
  federation_name?: string | null
  connected?: boolean
  ops_state?: string
  ops_url?: string | null
  claim_code?: string | null
}

/** `/v1/status` with the POS token, or why there is no answer. */
async function tillStatus(): Promise<
  | { ok: true; status: TillStatus }
  | { ok: false; why: 'no-token' | 'down' | number }
> {
  const token = (await posToken.read().once())?.trim()
  if (!token) return { ok: false, why: 'no-token' }
  try {
    const res = await fetch(`http://127.0.0.1:${tillPort}/v1/status`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return { ok: false, why: res.status }
    return { ok: true, status: (await res.json()) as TillStatus }
  } catch {
    return { ok: false, why: 'down' }
  }
}

export const main = sdk.setupMain(async ({ effects }) => {
  // Read once: a new Connect to registry needs no restart, because the running till polls the
  // claim it leaves (and the claim carries its own registry URL).
  const opsUrl =
    (await storeJson.read((s) => s.opsUrl).once()) ?? defaultRegistryUrl

  return sdk.Daemons.of(effects)
    .addDaemon('till', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'till' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: dataDir,
          readonly: false,
        }),
        'till',
      ),
      exec: {
        // Flags, not env: they show in the process list and the till's startup line, and clap
        // reads them the same on every runtime.
        command: tillCli(
          'till',
          'serve',
          '--listen',
          `0.0.0.0:${tillPort}`,
          // Every request reaches the till from StartOS's proxy, so none may skip the POS token
          // by coming from a local address. The till makes the token at startup if it is missing.
          '--require-pos-token',
          // Puts the till on ops. Its token is the one an approved claim left in its data
          // directory (till-ops.json); without one it waits for a claim and refuses card jobs.
          '--ops-url',
          opsUrl,
        ),
      },
      ready: {
        display: i18n('Till'),
        // Joining the federation's client and reporting to the registry come before the till
        // listens; both go over the network.
        gracePeriod: 60_000,
        fn: async () => {
          const r = await tillStatus()
          if (r.ok) {
            return {
              result: 'success',
              message: i18n('Ready for federation ${name}', {
                name: r.status.federation_name || '?',
              }),
            }
          }
          if (r.why === 'no-token') {
            return {
              result: 'starting',
              message: i18n('Waiting for the till to start'),
            }
          }
          return {
            result: 'failure',
            message:
              r.why === 'down'
                ? i18n('The till is not answering')
                : i18n('The till answered HTTP ${status}', { status: r.why }),
          }
        },
      },
      requires: [],
    })
    .addHealthCheck('registry', {
      ready: {
        display: i18n('Registry'),
        fn: async () => {
          const r = await tillStatus()
          if (!r.ok) {
            return {
              result: 'failure',
              message: i18n('The till is not answering'),
            }
          }
          const s = r.status
          switch (s.ops_state) {
            case 'connected':
              return {
                result: 'success',
                message: i18n('Connected (federation ${name})', {
                  name: s.federation_name || '?',
                }),
              }
            case 'waiting_for_approval':
              return {
                result: 'loading',
                message: i18n(
                  'Waiting for approval in the provisioner app (code ${code})',
                  { code: s.claim_code || '?' },
                ),
              }
            case 'claim_expired':
              return {
                result: 'failure',
                message: i18n(
                  'The request expired before it was approved. Run Connect to registry again.',
                ),
              }
            default:
              return {
                result: 'failure',
                message: i18n(
                  'Not connected to a registry. Run Connect to registry.',
                ),
              }
          }
        },
      },
      requires: ['till'],
    })
})
