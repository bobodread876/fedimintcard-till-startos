import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Package state the till has no config file for. Lives on the `startos` volume, which no
// subcontainer mounts.
// - opsUrl: the registry the last Connect to registry asked, passed as `--ops-url`, which puts the
//   till on ops (waiting for a token until a claim is approved). The till token itself is the
//   till's (`till-ops.json` in `main`).
// - payEnabled: whether the till runs with `--pay-enabled` (Turn on pay by card). Missing on every
//   install from before the action, which reads as off.
const shape = z.looseObject({
  opsUrl: z.string().optional().catch(undefined),
  payEnabled: z.boolean().catch(false),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
