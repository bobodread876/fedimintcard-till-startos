import { connectRegistry } from '../actions/connectRegistry'
import { joinFederation } from '../actions/joinFederation'
import { inviteCode, tillOps } from '../fileModels/tillFiles'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// The till cannot start without a wallet in a federation: while it has none, a critical task
// keeps the service stopped. Once it has one it runs without a registry token, waiting for one
// (Connect to registry); that task is important, not critical, because the till must be running
// to pick up the token, and it is cleared once the till has one.
export const watchSetup = sdk.setupOnInit(async (effects) => {
  const joined = !!(await inviteCode.read((s) => s.trim()).const(effects))
  const connected = !!(await tillOps.read((s) => s.url).const(effects))

  if (!joined) {
    await sdk.action.createOwnTask(effects, joinFederation, 'critical', {
      reason: i18n("Join a federation: the till's wallet lives there"),
    })
  }
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
