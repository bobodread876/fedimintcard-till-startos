import { chmod, lchown, lstat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { prepareWalletOwnership } from './walletOwnership'
import { connectRegistry } from '../actions/connectRegistry'
import { utils } from '@start9labs/start-sdk'
import { adminPassword } from '../fileModels/adminPassword'
import { inviteCode, tillOps } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchSetup = sdk.setupOnInit(async (effects) => {
  // Preserve the password across updates and backup restores. An administrator
  // reads it through the masked StartOS action.
  try {
    await writeFile(
      adminPassword.path,
      utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 32 }),
      { mode: 0o600, flag: 'wx' },
    )
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }
  const credential = await lstat(adminPassword.path)
  if (!credential.isFile() || credential.nlink !== 1) {
    throw new Error('The admin password must be a private regular file')
  }
  await chmod(adminPassword.path, 0o600)
  await lchown(adminPassword.path, 1000, 1000)
  await prepareWalletOwnership(dirname(adminPassword.path))
  const joined = !!(await inviteCode.read((s) => s.trim()).const(effects))
  const connected = !!(await tillOps.read((s) => s.url).const(effects))

  // Clear the old critical CLI setup task, including on an unjoined upgrade.
  await sdk.action.clearTask(effects, 'fedimintcard-till:join-federation')
  if (connected) {
    await sdk.action.clearTask(effects, 'fedimintcard-till:connect-registry')
  } else if (joined) {
    await sdk.action.createOwnTask(effects, connectRegistry, 'important', {
      reason: i18n(
        'Connect the till to the registry and approve it in the provisioner app',
      ),
    })
  }
})
