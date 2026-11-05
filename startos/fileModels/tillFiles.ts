import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { inviteFile, posTokenFile, tillOpsFile } from '../utils'

// Files the till itself writes in its data directory. The package only reads them.

// The invite code, written by `card-sidecar join` after the federation accepted the wallet: its
// presence is what "joined" means.
export const inviteCode = FileHelper.string({
  base: sdk.volumes.main,
  subpath: inviteFile,
})

// What an approved till claim left (`till serve`): the registry's URL and the till token. The
// package reads only the URL, to know the till is connected; it never shows or copies the token.
export const tillOps = FileHelper.json(
  { base: sdk.volumes.main, subpath: tillOpsFile },
  z.looseObject({
    url: z.string().optional().catch(undefined),
  }),
)

// The POS token: phones send it as a bearer, and so does the health check.
export const posToken = FileHelper.string({
  base: sdk.volumes.main,
  subpath: posTokenFile,
})
