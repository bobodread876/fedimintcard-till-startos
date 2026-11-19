import { storeJson } from '../fileModels/store.json'
import { payToken } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMount, pairingUrls, tillCall, tillCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await pairingUrls(effects, { lan: false })
    const keys = Object.keys(urls)
    return {
      name: i18n('Till address'),
      description: i18n(
        'The public https address the paying app will use. A paying app takes no plain http address.',
      ),
      default: keys[0] ?? null,
      values: keys.length ? urls : { none: i18n('No address yet') },
      disabled: keys.length
        ? false
        : i18n(
            'This till has no public https address yet. Add a public domain to the Till API interface.',
          ),
    }
  }),
})

// The pay-scope pairing (`till pair --scope pay`, upstream docs/PAY.md): a token that opens only
// paying an invoice with a card, looking up and refunding such a payment, /v1/health and the card
// link. Only offered while pay by card is on; a code from a till that refuses every payment
// (503 pay_disabled) would only confuse.
export const pairPayApp = sdk.Action.withInput(
  'pair-pay-app',
  async ({ effects }) => {
    const on = !!(await storeJson.read((s) => s.payEnabled).const(effects))
    return {
      name: i18n('Pair a paying app'),
      description: i18n(
        'Show the code that an app that pays with a card scans, such as the Forge app. Not for POS phones: they pair with Pair a POS. Every paying app shares one token.',
      ),
      warning: null,
      allowedStatuses: 'any',
      group: null,
      visibility: on
        ? 'enabled'
        : { disabled: i18n('Turn on pay by card first') },
    }
  },
  inputSpec,
  async () => null,
  async ({ effects, input }) => {
    if (!(await storeJson.read((s) => s.payEnabled).once())) {
      throw new Error(
        i18n('Pay by card is off. Run Turn on pay by card first.'),
      )
    }
    const urls = await pairingUrls(effects, { lan: false })
    if (!(input.url in urls)) {
      throw new Error(
        i18n(
          "That address is no longer one of this till's addresses. Open the action again.",
        ),
      )
    }
    // Makes the pay token only if there is none (Turn on pay by card already did) and prints only
    // the pairing text. It touches nothing but the token files, so it is safe while the till runs.
    const out = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      dataMount(),
      'pair-pay-app',
      (sub) =>
        sub.execFail(
          tillCli(
            'till',
            'pair',
            '--scope',
            'pay',
            '--text',
            '--url',
            input.url,
          ),
        ),
    )
    const text = String(out.stdout).trim()
    // A running till holds the pay token it started with: never show a code it would refuse.
    const token = (await payToken.read().once())?.trim()
    const r = token ? await tillCall('/v1/health', token) : 'down'
    if (r !== 'down' && r.status === 401) {
      throw new Error(
        i18n(
          'The running till does not have this pay token yet. Restart the service, then run this action again.',
        ),
      )
    }
    return {
      version: '1',
      title: i18n('Pair a paying app'),
      message: i18n(
        "In the app that pays with a card, scan this code or paste its text: in the Forge app on Android, Tap a Fedimint card. This code is for paying apps only; a POS phone refuses it. It carries the till's pay token: with it, an app can ask the till to charge a card it holds, with that card's PIN. To unpair every paying app, run Rotate pay token.",
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
