import { adminPassword } from './fileModels/adminPassword'
import { adminPhase } from './health'
import { storeJson } from './fileModels/store.json'
import { inviteCode, payToken, posToken } from './fileModels/tillFiles'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  adminPort,
  dataMount,
  defaultRegistryUrl,
  preferredPosOrigin,
  tillCall,
  tillCli,
  tillPort,
} from './utils'

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
  // Turn on / Turn off pay by card: the till reads `--pay-enabled` only at start, so a change
  // restarts it.
  const payEnabled = !!(await storeJson
    .read((s) => s.payEnabled)
    .const(effects))

  const posOrigin = await preferredPosOrigin(effects)

  const daemons = sdk.Daemons.of(effects)
    .addDaemon('till', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'till' },
        dataMount(),
        'till',
      ),
      exec: {
        // Flags, not env: they show in the process list and the till's startup line, and clap
        // reads them the same on every runtime.
        command: tillCli(
          'till',
          'admin',
          ...(posOrigin ? ['--pos-public-url', posOrigin] : []),
          '--admin-listen',
          `0.0.0.0:${adminPort}`,
          '--admin-password-file',
          '/data/admin-password',
          '--listen',
          `0.0.0.0:${tillPort}`,
          // Every request reaches the till from StartOS's proxy, so none may skip the POS token
          // by coming from a local address. The till makes the token at startup if it is missing.
          '--require-pos-token',
          // Puts the till on ops. Its token is the one an approved claim left in its data
          // directory (till-ops.json); without one it waits for a claim and refuses card jobs.
          '--ops-url',
          opsUrl,
          // Paying an invoice with a card (`POST /v1/pay`), at the till's default limits.
          ...(payEnabled ? ['--pay-enabled'] : []),
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
          const phase = await adminPhase(
            adminPort,
            await adminPassword.read().once(),
          )
          switch (phase) {
            case 'setup':
              return {
                result: 'success',
                message: i18n('Open Till admin to join a federation'),
              }
            case 'joining':
              return {
                result: 'starting',
                message: i18n('Joining the federation'),
              }
            case 'opening':
              return {
                result: 'starting',
                message: i18n('Opening the saved till wallet'),
              }
            case 'retrying':
              return {
                result: 'starting',
                message: i18n(
                  'Waiting for the federation to confirm support for this wallet. The till will retry.',
                ),
              }
            case 'unsupported':
              return {
                result: 'failure',
                message: i18n(
                  'This federation needs a supported Bitcoin mint. Open Till admin for details.',
                ),
              }
            case 'auth':
              return {
                result: 'failure',
                message: i18n('Till admin refused the saved admin password'),
              }
            case 'unavailable':
              return {
                result: 'failure',
                message: i18n('The till is not answering'),
              }
            case 'no-password':
              return {
                result: 'starting',
                message: i18n('Waiting for the till to start'),
              }
            case 'ready':
              if (r.why === 'no-token') {
                return {
                  result: 'starting',
                  message: i18n('Waiting for the POS API token'),
                }
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
          if (!(await inviteCode.read().once())) {
            return {
              result: 'loading',
              message: i18n('Open Till admin to join a federation'),
            }
          }
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

  if (!payEnabled) return daemons

  return daemons.addHealthCheck('pay', {
    ready: {
      display: i18n('Pay by card'),
      fn: async () => {
        const pay = (await payToken.read().once())?.trim()
        if (!pay) {
          return {
            result: 'failure',
            message: i18n(
              'There is no pay token. Turn pay by card off, then on again.',
            ),
          }
        }
        // The pay token as a paying app sends it: refused if the till started before it existed.
        const health = await tillCall('/v1/health', pay)
        if (health === 'down') {
          return {
            result: 'failure',
            message: i18n('The till is not answering'),
          }
        }
        if (health.status === 401) {
          return {
            result: 'failure',
            message: i18n(
              'The till does not take the current pay token. Restart the service.',
            ),
          }
        }
        // `POST /v1/pay {}` with the POS token is refused before anything runs: 400 bad_request
        // once paying is on, 503 with why while it cannot pay (TILL-API.md).
        const pos = (await posToken.read().once())?.trim()
        const probe = pos
          ? await tillCall('/v1/pay', pos, { method: 'POST', body: '{}' })
          : 'down'
        if (probe === 'down') {
          return {
            result: 'failure',
            message: i18n('The till is not answering'),
          }
        }
        const error = (probe.body as { error?: string } | null)?.error
        if (probe.status === 400 && error === 'bad_request') {
          return {
            result: 'success',
            message: i18n('On: paired apps can pay with a card'),
          }
        }
        if (error === 'pay_disabled') {
          return {
            result: 'failure',
            message: i18n(
              'The till started with pay by card off. Restart the service.',
            ),
          }
        }
        if (error === 'lightning_unavailable') {
          return {
            result: 'failure',
            message: i18n(
              "The till cannot pay Lightning invoices: its federation has no Lightning module the till's wallet can use.",
            ),
          }
        }
        return {
          result: 'failure',
          message: i18n('The till answered HTTP ${status}', {
            status: probe.status,
          }),
        }
      },
    },
    requires: ['till'],
  })
})
