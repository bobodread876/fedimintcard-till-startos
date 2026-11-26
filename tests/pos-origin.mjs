import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const sdkRequire = createRequire(require.resolve('@start9labs/start-sdk'))
const { filledAddress } = sdkRequire('@start9labs/start-core/util/filledAddress')
const source = await readFile(new URL('../startos/utils.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})

function fixture(available, { enabled = true, disabled = [], lanEnabled = [] } = {}) {
  const calls = []
  const binding = { enabled, addresses: { available, enabled: [], disabled, lanEnabled } }
  const host = { bindings: { 9877: binding } }
  binding.interfaces = { till: { addressInfo: filledAddress(host, {
    internalPort: 9877, scheme: 'http', sslScheme: 'https', username: null, suffix: '',
  }) } }
  const sdk = { host: { getOwn(_effects, hostId, select) {
    assert.equal(hostId, 'till')
    return { once: () => select(host), const() { calls.push('watch'); return select(host) } }
  } } }
  const module = {}
  const load = (path) => path === './sdk' ? { sdk } : { i18n: (value) => value }
  new Function('require', 'exports', outputText)(load, module)
  return { ...module, calls }
}

const port = 52000
const vpn = { hostname: '198.51.100.7', public: false, port, ssl: true, metadata: { kind: 'ipv4', gateway: 'gateway-b' } }
const lan = { hostname: '192.0.2.8', public: false, port, ssl: true, metadata: { kind: 'ipv4', gateway: 'gateway-a' } }
const mdns = { hostname: 'merchant.local', public: false, port, ssl: true, metadata: { kind: 'mdns', gateways: ['gateway-a'] } }
const domain = { hostname: 'till.example.test', public: true, port: 443, ssl: true, metadata: { kind: 'public-domain' } }
const managed = { hostname: 'merchant.example.test', public: false, port, ssl: true, metadata: { kind: 'private-domain', gateways: ['gateway-a'] } }
const urls = (pkg, lan = true) => Object.keys(pkg.pairingUrls({}, { lan }))

test('both pairing surfaces prefer public HTTPS, then mDNS to an earlier tunnel IP', () => {
  const tunnelFirst = [vpn, lan, managed, mdns]
  const pub = fixture([...tunnelFirst, { ...domain, ssl: false, port: 80 }, domain])
  assert.equal(pub.preferredPosOrigin({}), 'https://till.example.test')
  assert.deepEqual(urls(pub, false), ['https://till.example.test'])
  assert.deepEqual(pub.calls, ['watch'])
  const local = fixture(tunnelFirst)
  assert.equal(local.preferredPosOrigin({}), 'https://merchant.local:52000')
  assert.deepEqual(urls(local), [
    'https://merchant.local:52000', 'https://merchant.example.test:52000',
    'https://192.0.2.8:52000', 'https://198.51.100.7:52000',
  ])
  assert.deepEqual(urls(local, false), [])
})

test('only enabled IPs on a named gateway and matching port receive the LAN preference', () => {
  const fallback = fixture([vpn, { ...lan, port: 51000 }, lan, mdns], {
    disabled: [[mdns.hostname, port]], lanEnabled: [[lan.hostname, port]],
  })
  assert.deepEqual(urls(fallback), [
    'https://192.0.2.8:52000', 'https://198.51.100.7:52000', 'https://192.0.2.8:51000',
  ])
  const chooser = fixture([vpn, lan], { lanEnabled: [[lan.hostname, port]] })
  assert.deepEqual(urls(chooser), ['https://192.0.2.8:52000', 'https://198.51.100.7:52000'])
  assert.equal(fixture([vpn]).preferredPosOrigin({}), 'https://198.51.100.7:52000')
})

test('private HTTPS wins within its group and disabled interfaces supply no pairing address', () => {
  const plain = { ...mdns, ssl: false, port: 52001 }
  assert.deepEqual(urls(fixture([plain, mdns])), ['https://merchant.local:52000', 'http://merchant.local:52001'])
  assert.equal(fixture([plain]).preferredPosOrigin({}), 'http://merchant.local:52001')
  assert.equal(fixture([]).preferredPosOrigin({}), null)
  assert.equal(fixture([mdns], { enabled: false }).preferredPosOrigin({}), null)
})
