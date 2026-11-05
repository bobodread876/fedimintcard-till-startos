import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.0:0',
  releaseNotes: {
    en_US: 'First release of the Fedimint Card till for StartOS.',
    es_ES: 'Primera versión de la caja de Fedimint Card para StartOS.',
    de_DE: 'Erste Version der Fedimint-Card-Kasse für StartOS.',
    pl_PL: 'Pierwsze wydanie kasy Fedimint Card dla StartOS.',
    fr_FR: 'Première version de la caisse Fedimint Card pour StartOS.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
