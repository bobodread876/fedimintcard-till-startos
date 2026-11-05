import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Package state the till has no config file for: the registry the last Connect to registry asked.
// Passed to the daemon as OPS_URL, which puts the till on ops (waiting for a token until a claim
// is approved). The till token itself is the till's (`till-ops.json` in `main`). Lives on the
// `startos` volume, which no subcontainer mounts.
const shape = z.looseObject({
  opsUrl: z.string().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.startos, subpath: 'store.json' },
  shape,
)
