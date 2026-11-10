<p align="center">
  <img src="icon.svg" alt="Fedimint Card Till Logo" width="21%">
</p>

# Fedimint Card Till on StartOS

> Everything not listed in this document should behave the same as upstream
> Fedimint Card Till. If a feature, setting, or behavior is not mentioned here,
> the upstream documentation is accurate and fully applicable — see the
> Documentation section of `instructions.md` for links.

The till service of [fedimintcard](https://github.com/fedimintcard/fedimintcard) (`card-sidecar till serve`):
it holds a merchant wallet in a Fedimint federation, charges Fedimint eCash cards that a paired
POS phone taps, and keeps each card's state in the fedimintcard registry ("ops"). This package
runs it on its own. It connects to the registry by a till claim the operator approves in the
provisioner app (upstream `docs/TILL-CLAIM.md`), and pairs phones from StartOS actions.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built by this repo's `Dockerfile` from the `upstream-project` submodule (the
fedimintcard repository): `card-sidecar` compiled from its `host/` Rust workspace, on Debian slim
with CA certificates. Upstream publishes no image.

| | |
| --- | --- |
| Image source | Custom Dockerfile, cross-compiled from the submodule's source |
| Architectures | x86_64 |
| Entrypoint | None used; the daemon runs `card-sidecar --data-dir /data till serve` |
| Subcontainers | `till` (the daemon); actions run short-lived `join-federation`, `connect-registry` and `pair-pos` subcontainers |

The daemon runs with `--require-pos-token`: every `/v1` request needs the POS token as a
bearer, including requests that arrive from a local address, because every request reaches the
till through StartOS's proxy. Upstream's default exempts loopback.

## Volume and Data Layout

Two volumes. The till's data directory is the whole `main` volume; package settings live apart
from it.

| Volume | Mount point | Contents |
| --- | --- | --- |
| `main` | `/data` | The till's data directory: `mnemonic` (the wallet's root secret), `client.db` (the federation client's RocksDB), `invite`, `card_state.json`, `cards/` (per-card state on ops), `sales.json`, `cashouts.log`, `till-pos-token`, `till-claim.json` (a claim waiting for approval), `till-ops.json` (the till token, its registry's URL and the registry's certificate key for checking cards offline), `offline_queue.json` (payments taken offline and not yet sent), `offline_pool.json` (the secrets behind the offline kits handed to POS phones), `block-header.json` (the newest Bitcoin block header, for the cards' clocks) |
| `startos` | not mounted | `store.json` (the registry URL) |

`invite` is written by `join` only after the federation accepted the wallet; the package treats
its presence as "joined".

## File Models

The package keeps one file of its own and reads three of the till's.

- **`store.json`** (JSON, `startos` volume): `opsUrl`, the registry the last **Connect to
  registry** asked. `main.ts` reads it once per start and passes it as `--ops-url` (default
  `https://registry.fedimintcard.org`), which puts the till on ops; a change does not restart the
  till.
- **`till-ops.json`** (JSON, `main` volume, 0600): written by the till when an operator approves
  its claim: `url` and `token`. The package reads only `url`, to know the till is connected (the
  setup watcher); it never shows or copies the token. The till prefers it over `--ops-url`.
- **`invite`** and **`till-pos-token`** (plain text, `main` volume): written by the till
  (`join`, `till pair`, `till serve`); the package only reads them (the setup watcher and the
  health checks). Removing `till-pos-token` is how **Rotate POS token** works.
- `till-claim.json` is written by `till claim` and read and deleted by `till serve`; the package
  does not read it (the Registry check asks the till instead).

Other flags on every start: `--listen 0.0.0.0:9877`, `--require-pos-token`.

## Dependencies

None. The till reaches its federation's guardians and the registry over the internet itself.

## Network Access and Interfaces

One interface on one port. Its plain address serves HTTP; its TLS address is StartOS's TLS
wrapper in front of the same port.

| Interface | Type | Port | Protocol | Purpose |
| --- | --- | --- | --- | --- |
| `till` (Till API) | `api` | 9877 | HTTP, WebSocket upgrade on `/v1/card/link` | The POS apps' REST calls and the card link that carries a tapped card's APDUs |

Phones away from the merchant's network need a public domain on this interface with a
certificate they trust (Let's Encrypt). The pairing text carries `https://<domain>`; the phone
derives `wss://` for the card link from it. A charge can block for up to two minutes, and the card
link lives up to two minutes.

## Installation and First-Run Flow

Nothing is generated at install.

1. **Join federation** (critical task: the service stays stopped until it has run) makes the
   wallet (`mnemonic`) and joins it with the invite code.
2. The service starts. With no till token the till listens anyway, on ops but not connected:
   `/v1/status` says so and charges, balances and issues answer `ops_not_connected`. It makes
   the POS token if there is none.
3. **Connect to registry** (important task, enabled once joined) runs `till claim`: the registry
   answers a claim, and the action shows its QR text (`fedimintcard-till-claim:<registry>?c=<code>`)
   and code. The operator approves it in the provisioner app (Settings, Tills, Add a till).
4. The running till polls the claim every 3 s. On approval it writes `till-ops.json`, deletes
   the claim, reports its federation's name and mint keys to the registry, and is on ops, with
   no restart. The operator has 10 minutes to approve a claim; once approved, the registry keeps
   it for 7 days, so a till that was stopped or restarting at the approval collects its token
   when it next runs. The till polls only while it runs, which is why Connect to registry waits
   for Join federation.

## Actions

Four user-facing actions; none is hidden.

- **Join federation** — once, at setup. Writes `mnemonic`, `client.db` and `invite` in `main`.
  Takes a few seconds (it downloads the federation's config from a guardian). Refuses when
  `invite` exists: a till never changes federations. If it fails partway, `mnemonic` may already
  exist; a second run reuses it.
- **Connect to registry** — at setup, after an expired claim, and after the operator revoked
  this till (charges then fail with `ops_refused`). Inputs: the till's name (default
  `StartOS till`, what the operator sees and what `GET /tills` lists) and the registry URL.
  Stores the URL in `store.json` and runs `till claim --text --replace`: writes `till-claim.json`
  (replacing any earlier claim) and returns the QR text with a QR code, and the code. Safe while
  the till runs and safe to repeat; a connected till keeps its token until the new claim is
  approved. Disabled until the till has joined a federation. Upstream's
  `registry/scripts/new-till.sh` (a token made on the operator's computer) still works for tills
  run from the command line; this package no longer takes a pasted token.
- **Pair a POS** — whenever a phone needs pairing. Runs `till pair --text --url <address>`:
  makes the POS token if there is none, changes nothing else, and is safe while the till runs.
  Returns the `fedimintcard-till:<url>?t=<token>` text, masked, with a QR code. Offers the
  interface's public domains over `https`, then its LAN addresses over plain `http`.
- **Rotate POS token** — when a phone is lost or the QR code leaked. Deletes
  `till-pos-token`; the till makes a new one at its next start, and every phone has to pair again.
  Instant. Repeating it before a start does nothing more.

## Tasks

Two tasks, raised by a watcher that runs on every container start and whenever `invite` or
`till-ops.json` changes.

| Task | Raised when | Cleared by |
| --- | --- | --- |
| Join federation (critical) | `main/invite` is missing or empty | Running **Join federation** successfully |
| Connect to registry (important) | joined, and `main/till-ops.json` has no `url` | Running **Connect to registry**, or the till writing `till-ops.json` (the watcher clears it) |

Connect to registry is not critical: the till has to be running to pick up its token. Either task
returns only if its file is removed by hand (or a restore brings back a till that never finished
setup).

## Health Checks

Two checks.

- **Till** — `GET /v1/status` on `127.0.0.1:9877` with the POS token as a bearer, every 30 s
  once healthy. Grace period 60 s: before listening, the till opens its federation client and
  reports to the registry, both over the network. Success shows the federation's name.
  - *The till is not answering* after the grace period: the daemon is exiting; the service log
    says why (a wallet that will not open, the port taken).
  - *The till answered HTTP 401*: `till-pos-token` changed after the till started (a rotation
    while it ran by hand); restart the service.
- **Registry** — the same `/v1/status`, its `ops_state`, once the till is ready.
  - *Connected (federation …)*: on ops.
  - *Waiting for approval in the provisioner app (code …)* (loading): a claim is live; approve it
    in the app before it expires.
  - *The request expired before it was approved*: run **Connect to registry** again.
  - *Not connected to a registry*: no token and no claim; run **Connect to registry**.

  A revoked till token still reads *Connected*: the till logs `could not report the federation's
  name and mint keys to ops` at startup and every charge fails with `ops_refused`. Run **Connect
  to registry** and approve the new claim.

## Backups and Restore

Both volumes are copied whole (`ofVolumes('main', 'startos')`); StartOS stops the till for the
backup. A restore brings back the wallet (mnemonic and client database), the card state the till
holds locally, the sales ledger, the POS token (paired phones keep working) and the registry
settings (the till token is in `main`, so a restored till stays connected).

`offline_queue.json` is in `main`, so a backup taken while payments wait to be sent keeps them;
restoring an older backup loses the payments taken offline after it (the cards have already
spent those notes). Back up after the queue is empty when you can (`/v1/status`
`offline.queued: 0`).

`offline_pool.json` holds the secrets behind the offline kits the till hands to POS phones. A
restore from a backup taken before a kit was handed out leaves the till not knowing that kit: the
payments a phone took with it stay on the phone, waiting, until the phone syncs to a till that
knows them. Back up after the phones have synced when you can (`offline.queued: 0` on
`/v1/status`, and no payments waiting in the POS app's Settings).

The card state that matters lives in the registry, not on the box: a restored till reloads each
card from ops on its next tap. Restoring an old backup of the wallet loses the eCash the till
collected after that backup (the mnemonic can recover notes only through the federation's own
recovery, which this package does not drive).

## Limitations and Differences

1. The POS token is required on every request, loopback included (upstream exempts loopback).
2. No USB relay: `CARD_BRIDGE_URL` points at nothing, so a charge must come with a phone's card
   link (`X-Card-Link`). `/v1/status` always reports `card_relay_ok: false`.
3. The wallet's other commands are not offered as actions: taking the till's takings out as
   eCash (`ecash export`), importing eCash, `info`. Upstream says not to run them while
   `till serve` owns the data directory.
4. A till joins one federation for good; changing federations means a new install.
5. x86_64 only.
6. Offline payments (upstream `docs/OFFLINE-PROTOCOL.md`) use upstream's defaults: up to 100,000
   sat and 200 payments unsettled, 12 spare slots kept per card, a fee margin of 100 msat per
   input and output on federations at core consensus 2.1, block headers from mempool.space. The
   package does not expose these as settings. POS phones offline (upstream `docs/POS-OFFLINE.md`)
   use the defaults too: an offline kit lasts a week (`--offline-kit-ttl-hours` 168) and the
   payments taken with it are accepted for 30 days after (`--offline-kit-grace-days`); a phone's
   offline payments count toward the till's limits above.

---

## Quick Reference for AI Consumers

```yaml
package_id: fedimintcard-till
image: built from Dockerfile (upstream-project submodule)
architectures: [x86_64]
subcontainers: [till]
volumes:
  main: /data
  startos: (not mounted)
file_models:
  - startos/store.json
  - main/invite (read only)
  - main/till-pos-token (read only)
  - main/till-ops.json (read only, url only)
startos_managed_flags:
  - --ops-url
  - --listen
  - --require-pos-token
dependencies: none
interfaces:
  till: { type: api, port: 9877 }
actions:
  - join-federation
  - connect-registry
  - pair-pos
  - rotate-pos-token
tasks:
  - { action: join-federation, severity: critical }
  - { action: connect-registry, severity: important }
health_checks:
  - till
  - registry
```
