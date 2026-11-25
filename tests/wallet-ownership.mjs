import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { syncBuiltinESMExports } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { prepareWalletOwnership } from '../startos/init/walletOwnership.ts'

test('legacy wallet ownership resumes without following symlinks or touching file contents', async (t) => {
  const temp = await fs.mkdtemp(join(tmpdir(), 'startos-wallet-'))
  t.after(() => fs.rm(temp, { recursive: true, force: true }))
  const root = join(temp, 'wallet')
  const nested = join(root, 'ledger')
  const legacy = join(nested, 'backup-state')
  const external = join(temp, 'outside')
  const linked = join(root, 'symbolic')
  const separateMount = join(root, 'other-filesystem')
  await fs.mkdir(nested, { recursive: true })
  await fs.mkdir(separateMount)
  await fs.writeFile(legacy, 'fixture bytes', { mode: 0o600 })
  await fs.writeFile(external, 'external')
  await fs.symlink(external, linked)

  // Model root/UID 1000 and an interrupted chown on a non-root developer machine.
  const owners = new Map()
  const calls = []
  let interrupted = false
  const stat = fs.lstat.bind(fs)
  t.mock.method(fs, 'lstat', async (path) => {
    const entry = await stat(path)
    if (path === separateMount) entry.dev += 1
    ;[entry.uid, entry.gid] = owners.get(path) ?? [0, 0]
    return entry
  })
  t.mock.method(fs, 'lchown', async (path, uid, gid) => {
    if (path === nested && !interrupted) {
      interrupted = true
      throw new Error('simulated interruption')
    }
    calls.push(path)
    owners.set(path, [uid, gid])
  })
  syncBuiltinESMExports()
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports() })

  await assert.rejects(prepareWalletOwnership(root), /simulated interruption/)
  assert.equal(owners.has(root), false)
  await prepareWalletOwnership(root)
  assert.deepEqual(owners.get(root), [1000, 1000])
  assert.deepEqual(owners.get(legacy), [1000, 1000])
  assert.equal(calls.at(-1), root)
  assert.equal(calls.includes(external) || calls.includes(linked) || calls.includes(separateMount), false)
  const totalCalls = calls.length
  await prepareWalletOwnership(root)
  assert.equal(calls.length, totalCalls)
  assert.equal((await stat(legacy)).mode & 0o777, 0o600)
  assert.equal(await fs.readFile(legacy, 'utf8'), 'fixture bytes')
  assert.equal(await fs.readFile(external, 'utf8'), 'external')
})
