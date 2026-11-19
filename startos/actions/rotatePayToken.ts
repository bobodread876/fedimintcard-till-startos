import { payToken } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { dataMount, tillCli, tokenOnlyUrl } from '../utils'

// `till pair --scope pay --new-token` writes a new pay token in place. Unlike the POS token, the
// pay token cannot simply be removed: `till serve` never makes one, so a till started without it
// would refuse every paying app until the next pairing and restart. Stopped only, so the till
// that starts next holds the new token. The POS token is not touched.
export const rotatePayToken = sdk.Action.withoutInput(
  'rotate-pay-token',
  async ({ effects }) => {
    const made = !!(await payToken.read((s) => s.trim()).const(effects))
    return {
      name: i18n('Rotate pay token'),
      description: i18n(
        'Replace the pay token. Every paired paying app stops working until it is paired again. POS phones are not affected.',
      ),
      warning: i18n(
        'Every paying app paired with this till is unpaired. Pair each one again with Pair a paying app. POS phones stay paired.',
      ),
      allowedStatuses: 'only-stopped',
      group: null,
      visibility: made
        ? 'enabled'
        : { disabled: i18n('There is no pay token yet') },
    }
  },
  async ({ effects }) => {
    await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'till' },
      dataMount(),
      'rotate-pay-token',
      (sub) =>
        sub.execFail(
          tillCli(
            'till',
            'pair',
            '--scope',
            'pay',
            '--new-token',
            '--text',
            '--url',
            tokenOnlyUrl,
          ),
        ),
    )
    return {
      version: '1',
      title: i18n('Pay token replaced'),
      message: i18n(
        'The till takes the new token when it starts. Start the service, then pair each paying app again with Pair a paying app.',
      ),
      result: null,
    }
  },
)
