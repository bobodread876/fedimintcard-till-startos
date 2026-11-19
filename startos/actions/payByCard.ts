import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMount, tillCli, tokenOnlyUrl } from '../utils'

const payEnabled = storeJson.read((s) => s.payEnabled)

// Turns `till serve --pay-enabled` on or off (main.ts reads the flag with `.const`, so a running
// till restarts with it). Turning it on makes the pay token first, so the till that restarts
// already holds it: `till serve` reads that token only at start and never makes it.
export const payByCard = sdk.Action.withoutInput(
  'pay-by-card',
  async ({ effects }) => {
    const on = !!(await payEnabled.const(effects))
    return {
      name: on ? i18n('Turn off pay by card') : i18n('Turn on pay by card'),
      description: i18n(
        'Let an app that pays with a card, such as the Forge app, ask this till to charge a card and pay a Lightning invoice with what the card paid. Off unless you turn it on.',
      ),
      warning: on
        ? i18n(
            'Paying apps can no longer pay with a card at this till. They stay paired, so they can still look up a payment and get back one that failed. The till restarts if it is running.',
          )
        : i18n(
            "Anyone you give the paying-app code to can ask this till to charge a card they hold, with that card's PIN, and pay a Lightning invoice from the till's wallet with what the card paid. The till's limits apply: at most 100,000 sats an invoice, 1,000,000 sats a day in all, and a fee reserve of at most 1,000 sats a payment, of which what Lightning does not use stays in the till's wallet. The till restarts if it is running.",
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },
  async ({ effects }) => {
    const on = !!(await payEnabled.once())
    if (on) {
      await storeJson.merge(effects, { payEnabled: false })
      return {
        version: '1',
        title: i18n('Pay by card is off'),
        message: i18n(
          'To unpair the paying apps as well, run Rotate pay token.',
        ),
        result: null,
      }
    }
    // Makes the pay token (and the POS token) if there is none; the pairing text it prints
    // carries a placeholder address and is thrown away.
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      dataMount(),
      'pay-by-card',
      (sub) =>
        sub.execFail(
          tillCli(
            'till',
            'pair',
            '--scope',
            'pay',
            '--text',
            '--url',
            tokenOnlyUrl,
          ),
        ),
    )
    await storeJson.merge(effects, { payEnabled: true })
    return {
      version: '1',
      title: i18n('Pay by card is on'),
      message: i18n(
        'Run Pair a paying app to show the code an app scans. The Pay by card check shows whether the till is ready to pay.',
      ),
      result: null,
    }
  },
)
