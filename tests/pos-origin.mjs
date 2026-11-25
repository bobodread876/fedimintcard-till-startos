import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../startos/utils.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
})

function fixture(routes, enabled = true) {
  const calls = []
  const addresses = { nonLocal: { filter({ visibility }) {
    return { format: () => (routes[visibility] ?? []).map((url) => new URL(url)) }
  } } }
  const sdk = { host: { getOwn(effects, name, select) {
    assert.equal(name, 'till')
    const host = { bindings: { 9877: { enabled, interfaces: { till: { addressInfo: addresses } } } } }
    return { once: () => select(host), const() { calls.push('watch'); return select(host) } }
  } } }
  const module = {}
  const require = (path) => path === './sdk' ? { sdk } : { i18n: (value) => value }
  new Function('require', 'exports', outputText)(require, module)
  return { ...module, calls }
}

test('admin and StartOS actions select from the enabled phone interface', () => {
  const routes = { public: ['http://api.example', 'https://api.example:9443'], private: ['https://node.local:443', 'http://192.168.1.8:20000'] }
  const pkg = fixture(routes)
  assert.deepEqual(Object.keys(pkg.pairingUrls({}, { lan: true })), [
    'https://api.example:9443', 'http://192.168.1.8:20000', 'https://node.local',
  ])
  assert.deepEqual(Object.keys(pkg.pairingUrls({}, { lan: false })), ['https://api.example:9443'])
  assert.equal(pkg.preferredPosOrigin({}), 'https://api.example:9443')
  assert.deepEqual(pkg.calls, ['watch'])
  assert.equal(fixture({ private: ['http://node.local:10777'] }).preferredPosOrigin({}), 'http://node.local:10777')
  assert.equal(fixture({}).preferredPosOrigin({}), null)
  assert.equal(fixture(routes, false).preferredPosOrigin({}), null)
})
