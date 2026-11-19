import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMount, pairingUrls, tillCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await pairingUrls(effects, { lan: true })
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
      'Show the pairing code for the POS phones that take payments at this till, to scan in the POS app (Settings, Pair with till). Every POS phone shares one token. For an app that pays with a card, use Pair a paying app.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    const urls = await pairingUrls(effects, { lan: true })
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
      dataMount(),
      'pair-pos',
      (sub) =>
        sub.execFail(tillCli('till', 'pair', '--text', '--url', input.url)),
    )
    const text = String(out.stdout).trim()
    return {
      version: '1',
      title: i18n('Pair a POS'),
      message: i18n(
        "In the POS app open Settings, then Pair with till, and scan this code. It is for POS phones only. It carries the till's POS token: show it only to phones you trust. To unpair every POS phone, run Rotate POS token.",
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
