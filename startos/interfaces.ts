import { i18n } from './i18n'
import { sdk } from './sdk'
import { tillPort } from './utils'

// One HTTP API on the till's port: the POS apps' REST calls and the card-link WebSocket
// (`GET /v1/card/link`). StartOS serves it plain and, with addSsl (the http default), behind TLS
// it terminates; every /v1 request needs the POS token either way.
export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const tillMulti = sdk.MultiHost.of(effects, 'till')
  const tillOrigin = await tillMulti.bindPort(tillPort, {
    protocol: 'http',
    preferredExternalPort: tillPort,
  })

  const till = sdk.createInterface(effects, {
    name: i18n('Till API'),
    id: 'till',
    description: i18n(
      'The API the Fedimint Card POS apps call, card link included. Pair a phone with the Pair a POS action; every request needs the POS token.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  return [await tillOrigin.export([till])]
})
