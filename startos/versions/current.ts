import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:10',
  releaseNotes: {
    en_US:
      'Card 4.0 till with browser setup, sales and payouts. Requires a Card 4.0 registry. Accepts Card 4.0 and compatible later 4.x cards only.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
