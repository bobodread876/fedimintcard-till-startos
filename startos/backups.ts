import { sdk } from './sdk'

// The whole wallet (main: mnemonic, federation client database, card state, sales, POS token)
// and store.json (startos: the registry URL). The till token is in main (till-ops.json).
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('main', 'startos'),
)
