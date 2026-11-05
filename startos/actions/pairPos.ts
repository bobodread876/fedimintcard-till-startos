import { T } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataDir, tillCli, tillPort } from '../utils'

const { InputSpec, Value } = sdk

/**
 * Addresses a phone can pair with, best first: the interface's public domains over https (a
 * certificate the phone trusts, such as Let's Encrypt, is the owner's choice when adding the
 * domain), then its LAN addresses over plain http for phones on the same network.
 */
async function pairingUrls(
  effects: T.Effects,
): Promise<Record<string, string>> {
  const iface = await sdk.host
    .getOwn(
      effects,
      'till',
      (host) => host?.bindings[tillPort]?.interfaces['till'],
    )
    .once()
  const addresses = iface?.addressInfo
  if (!addresses) return {}
  const urls: Record<string, string> = {}
  for (const u of addresses.nonLocal
    .filter({ visibility: 'public', kind: 'domain' })
    .format('url')) {
    if (u.protocol === 'https:')
      urls[origin(u)] = i18n('${url} (public domain)', { url: origin(u) })
  }
  for (const u of addresses.nonLocal
    .filter({ visibility: 'private' })
    .format('url')) {
    if (u.protocol === 'http:')
      urls[origin(u)] = i18n('${url} (this network only)', { url: origin(u) })
  }
  return urls
}

// `https://till.example.com` with no trailing slash: what `till pair --url` takes.
const origin = (u: URL) => `${u.protocol}//${u.host}`

const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await pairingUrls(effects)
    const keys = Object.keys(urls)
    return {
      name: i18n('Till address'),
      description: i18n(
        'The address the phone will use. Choose the public domain for phones away from this network.',
      ),
      default: keys[0] ?? null,
      values: keys.length ? urls : { none: i18n('No address yet') },
      disabled: keys.length
        ? false
        : i18n(
            'This till has no address a phone can reach yet. Add a domain to the Till API interface.',
          ),
    }
  }),
})

export const pairPos = sdk.Action.withInput(
  'pair-pos',
  async () => ({
    name: i18n('Pair a POS'),
    description: i18n(
      'Show the pairing QR code to scan in the POS app (Settings, Pair with till). Every phone paired with this till shares one token.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    const urls = await pairingUrls(effects)
    if (!(input.url in urls)) {
      throw new Error(
        i18n(
          "That address is no longer one of this till's addresses. Open the action again.",
        ),
      )
    }
    // Makes the POS token if there is none (a till that has not started yet) and prints only the
    // pairing text. It touches nothing but the token file, so it is safe while the till runs.
    const out = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: dataDir,
        readonly: false,
      }),
      'pair-pos',
      (sub) =>
        sub.execFail(tillCli('till', 'pair', '--text', '--url', input.url)),
    )
    const text = String(out.stdout).trim()
    return {
      version: '1',
      title: i18n('Pair a POS'),
      message: i18n(
        "In the POS app open Settings, then Pair with till, and scan this code. It carries the till's POS token: show it only to phones you trust. To unpair every phone, run Rotate POS token.",
      ),
      result: {
        type: 'single',
        value: text,
        masked: true,
        copyable: true,
        qr: true,
        launchable: false,
      },
    }
  },
)
