import { T } from '@start9labs/start-sdk'
import { i18n } from './i18n'
import { sdk } from './sdk'

// The till's port inside the container: `till serve --listen 0.0.0.0:9877`, bound by the 'till'
// interface and health-checked in main.ts.
export const tillPort = 9877
export const adminPort = 9878

// The wallet's data directory inside every subcontainer: the `main` volume.
export const dataDir = '/data'

// The fedimintcard registry ("ops"), prefilled in the Connect to registry action and passed to
// the till until it has a token of its own.
export const defaultRegistryUrl = 'https://registry.fedimintcard.org'
// What the operator sees before approving (Connect to registry).
export const defaultTillName = 'StartOS till'

// The app's own files in its data directory (fedimintcard host/sidecar/src/{wallet,pos}.rs).
export const inviteFile = 'invite' // written by `join` once the federation accepted the wallet
export const posTokenFile = 'till-pos-token' // the POS bearer token (`till pair`)
export const payTokenFile = 'till-pay-token' // the pay-scope bearer token (`till pair --scope pay`)
export const tillOpsFile = 'till-ops.json' // the till token and registry URL an approved claim left

// `till pair` takes a URL even when only its token is wanted: the actions that make or replace
// the pay token pass this one and throw the printed pairing text away. Pair a paying app prints
// the real one.
export const tokenOnlyUrl = `http://127.0.0.1:${tillPort}`

// `card-sidecar` with the data directory set: the rest of the command line follows.
export const tillCli = (...args: string[]): [string, ...string[]] => [
  'card-sidecar',
  '--data-dir',
  dataDir,
  ...args,
]

// The `main` volume at the data directory, for an action's short-lived subcontainer.
export const dataMount = () =>
  sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: dataDir,
    readonly: false,
  })

// `https://till.example.com` with no trailing slash: what `till pair --url` takes.
const origin = (u: URL) => `${u.protocol}//${u.host}`

/** Read only routes StartOS advertises for the POS service. Use a trusted public
 * HTTPS domain first, then the advertised LAN routes when the phone is on-site. */
function readPairingUrls<R>(
  effects: T.Effects,
  lan: boolean,
  select: (urls: Record<string, string>) => R,
) {
  return sdk.host.getOwn(effects, 'till', (host) => {
    const urls: Record<string, string> = {}
    const binding = host?.bindings[tillPort]
    const addresses = binding?.enabled
      ? binding.interfaces['till']?.addressInfo
      : undefined
    if (addresses) {
      for (const u of addresses.nonLocal
        .filter({ visibility: 'public', kind: 'domain' })
        .format('url')) {
        if (u.protocol === 'https:')
          urls[origin(u)] = i18n('${url} (public domain)', { url: origin(u) })
      }
      if (lan) {
        const local = addresses.nonLocal
          .filter({ visibility: 'private' })
          .format('url')
        for (const scheme of ['http:', 'https:']) {
          for (const u of local) {
            if (u.protocol === scheme)
              urls[origin(u)] = i18n('${url} (this network only)', {
                url: origin(u),
              })
          }
        }
      }
    }
    return select(urls)
  })
}

export function pairingUrls(effects: T.Effects, { lan }: { lan: boolean }) {
  return readPairingUrls(effects, lan, (urls) => urls).once()
}

export function preferredPosOrigin(effects: T.Effects) {
  return readPairingUrls(
    effects,
    true,
    (urls) => Object.keys(urls)[0] ?? null,
  ).const()
}

/** What the till answers `path` with `token` as the bearer (GET unless told): status and JSON body, or 'down'. */
export async function tillCall(
  path: string,
  token: string,
  init: { method?: string; body?: string } = {},
): Promise<{ status: number; body: unknown } | 'down'> {
  try {
    const res = await fetch(`http://127.0.0.1:${tillPort}${path}`, {
      method: init.method ?? 'GET',
      body: init.body,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    })
    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      // Not JSON: the status says enough.
    }
    return { status: res.status, body }
  } catch {
    return 'down'
  }
}
