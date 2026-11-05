import { rm } from 'node:fs/promises'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { posTokenFile } from '../utils'

// Removing the token is how the till forgets it: at its next start it makes a new one
// (`till serve --require-pos-token`), and Pair a POS shows the new one.
export const rotatePosToken = sdk.Action.withoutInput(
  'rotate-pos-token',
  async () => ({
    name: i18n('Rotate POS token'),
    description: i18n(
      'Replace the POS token. Every paired phone stops working until it is paired again.',
    ),
    warning: i18n(
      'Every POS phone paired with this till is unpaired. Pair each one again with Pair a POS.',
    ),
    allowedStatuses: 'only-stopped',
    group: null,
    visibility: 'enabled',
  }),
  async () => {
    await rm(sdk.volumes.main.subpath(posTokenFile), { force: true })
    return {
      version: '1',
      title: i18n('POS token removed'),
      message: i18n(
        'The till makes a new token when it starts. Start the service, then pair each phone again with Pair a POS.',
      ),
      result: null,
    }
  },
)
