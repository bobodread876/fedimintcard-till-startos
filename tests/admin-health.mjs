import assert from 'node:assert/strict'
import test from 'node:test'
import { adminPhase } from '../startos/health.ts'

test('reports each authenticated admin phase while the POS API starts', async () => {
  const cases = [
    [
      { joined: false, starting: false, joining: false, setup_error: null },
      'setup',
    ],
    [
      { joined: false, starting: true, joining: true, setup_error: null },
      'joining',
    ],
    [
      { joined: false, starting: true, joining: false, setup_error: null },
      'opening',
    ],
    [
      { joined: false, setup_error: 'The federation has no supported mint.' },
      'unsupported',
    ],
    [{ joined: false, starting: true, retrying_mint: true }, 'retrying'],
    [{ joined: true }, 'ready'],
    [{ ok: true }, 'unavailable'],
  ]
  for (const [body, wanted] of cases) {
    const phase = await adminPhase(
      18441,
      'fixture-password\n',
      async (url, init) => {
        assert.equal(url, 'http://127.0.0.1:18441/admin/status')
        assert.equal(init.headers.authorization, 'Bearer fixture-password')
        assert.equal(init.redirect, 'error')
        return Response.json(body)
      },
    )
    assert.equal(phase, wanted)
  }
})

test('distinguishes missing, rejected and unreachable admin credentials', async () => {
  assert.equal(
    await adminPhase(18441, null, async (url, init) => {
      assert.equal(url, 'http://127.0.0.1:18441/healthz')
      assert.equal(init.headers, undefined)
      return new Response(null, { status: 200 })
    }),
    'no-password',
  )
  assert.equal(
    await adminPhase(
      18441,
      'fixture',
      async () => new Response(null, { status: 401 }),
    ),
    'auth',
  )
  assert.equal(
    await adminPhase(18441, 'fixture', async () => {
      throw new Error('connection closed')
    }),
    'unavailable',
  )
  assert.equal(
    await adminPhase(18441, 'fixture', async () => new Response('<html>')),
    'unavailable',
  )
})
