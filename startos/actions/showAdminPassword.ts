import { adminPassword } from '../fileModels/adminPassword'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const showAdminPassword = sdk.Action.withoutInput(
  'show-admin-password',
  async () => ({
    name: i18n('Show admin password'),
    description: i18n('Copy the password for Till admin.'),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),
  async () => {
    const password = await adminPassword.read().once()
    if (!password) throw new Error(i18n('Waiting for the till to start'))
    return {
      version: '1',
      title: i18n('Show admin password'),
      message: i18n('Open Till admin and enter this password.'),
      result: {
        type: 'single',
        value: password,
        masked: true,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
