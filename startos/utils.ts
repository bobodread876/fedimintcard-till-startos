// The till's port inside the container: `till serve --listen 0.0.0.0:9877`, bound by the 'till'
// interface and health-checked in main.ts.
export const tillPort = 9877

// The wallet's data directory inside every subcontainer: the `main` volume.
export const dataDir = '/data'

// The fedimintcard registry ("ops"), prefilled in the Connect to registry action and passed to
// the till until it has a token of its own.
export const defaultRegistryUrl = 'https://registry.fedimintcard.org'
// What the operator sees before approving (Connect to registry).
export const defaultTillName = 'StartOS till'

// The app's own files in its data directory (fedimintcard host/sidecar/src/{wallet,pos}.rs).
export const inviteFile = 'invite' // written by `join` once the federation accepted the wallet
export const posTokenFile = 'till-pos-token' // the POS bearer token (`till pair`)
export const tillOpsFile = 'till-ops.json' // the till token and registry URL an approved claim left

// `card-sidecar` with the data directory set: the rest of the command line follows.
export const tillCli = (...args: string[]): [string, ...string[]] => [
  'card-sidecar',
  '--data-dir',
  dataDir,
  ...args,
]
