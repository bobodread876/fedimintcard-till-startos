import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:12',
  releaseNotes: {
    en_US:
      'Card 4.0 till for Bitcoin mint v1 and mint v2 federations, with Lightning v2, metadata and wallet v2 support. POS shows the card credit, top-up fee and Lightning invoice total before payment. A new till can receive its first customer top-up with a zero balance. Phone pairing prefers the Till API’s public HTTPS domain or its local network name. Requires compatible 4.x cards and a Card 4.0 registry that supports the federation’s mint.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
