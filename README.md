<p align="center">
  <img src="icon.svg" alt="Fedimint Card Till Logo" width="21%">
</p>

# Fedimint Card 4.0 Till on StartOS

This till requires a Card 4.0 registry. It accepts Card 4.0 and compatible later 4.x cards only. Keep a 3.0 till for 3.0 cards or a 3.0 registry. The till supports Bitcoin mint v1 and mint v2. Card operations require a registry that supports the federation’s mint.

[Download the Card 4.0 StartOS packages and Android POS APK](https://github.com/fedimintcard/fedimintcard/releases/tag/till-v0.1.0). The [merchant setup guide](instructions.md#getting-set-up) covers registry selection, pairing and how to confirm the phone is ready for offline sales.

> Everything not listed in this document should behave the same as upstream
> Fedimint Card Till. If a feature, setting, or behavior is not mentioned here,
> the upstream documentation is accurate and fully applicable; see the
> Documentation section of `instructions.md` for links.

The till service of [fedimintcard](https://github.com/fedimintcard/fedimintcard) (`card-sidecar till admin`):
it holds a merchant wallet in a Fedimint federation, charges Fedimint eCash cards that a paired
POS phone taps, and keeps each card's state in the fedimintcard registry ("ops"). This package
runs it on its own. It connects to the registry by a till claim the operator approves in the
provisioner app (upstream `docs/TILL-CLAIM.md`), and pairs phones from Till admin or the StartOS actions. Paying a
Lightning invoice with a card for another app (upstream `docs/PAY.md`) is off until the owner
turns it on.

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

The till image runs the admin page on port 9878 and the phone API on port 9877. The package supports x86_64 and aarch64. Release packages pin the upstream GHCR index. A local OCI archive supplies the same image while testing an unreleased build. See UPDATING.md.

On upgrade, StartOS transfers root-owned wallet files to UID 1000 before starting the till. This preserves wallet contents and permissions. The daemon and its actions then use the same volume.

The daemon runs with `--require-pos-token`: every `/v1` request needs the POS token as a
bearer, including requests that arrive from a local address, because every request reaches the
till through StartOS's proxy. Upstream's default exempts loopback. The one other bearer the till
takes is the pay token, held to the pay routes (below).

## Volume and Data Layout

Two volumes. The till's data directory is the whole `main` volume; package settings live apart
from it.

| Volume | Mount point | Contents |
| --- | --- | --- |
| `main` | `/data` | The till's data directory: `mnemonic` (the wallet's root secret), `client.db` (the federation client's RocksDB), `invite`, `card_state.json`, `cards/` (per-card state on ops), `sales.json`, `cashouts.log`, `topups.json` (Lightning top-ups and their state), `holder_loads.json` (card loads in flight), `till-pos-token`, `till-pay-token` (the pay-scope token, once pay by card was turned on), `pays.json` (payments made with a card for a paying app, and their refunds), `till-claim.json` (a claim waiting for approval), `till-ops.json` (the till token, its registry's URL and the registry's certificate key for checking cards offline), `offline_queue.json` (payments taken offline and not yet sent), `offline_pool.json` (the secrets behind the offline kits handed to POS phones), `block-header.json` (the newest Bitcoin block header, for the cards' clocks) |
| `startos` | not mounted | `store.json` (the registry URL) |

The saved `invite` identifies the federation recorded during setup. Till admin shows whether
the wallet is opening, and the Till health check reports when the POS API is ready.

## File Models

StartOS keeps its registry settings and admin password and reads the till's setup files.

- **`admin-password`** (main volume, mode 0600) holds the per-install credential used by the Till admin interface.

- **`store.json`** (JSON, `startos` volume): `opsUrl`, the registry the last **Connect to
  registry** asked. `main.ts` reads it once per start and passes it as `--ops-url` (default
  `https://registry.fedimintcard.org`), which puts the till on ops; a change does not restart the
  till. `payEnabled` (missing reads as `false`): set by **Turn on / Turn off pay by card**;
  `main.ts` reads it reactively and passes `--pay-enabled` when true, so a change restarts a
  running till.
- **`till-ops.json`** (JSON, `main` volume, 0600): written by the till when an operator approves
  its claim: `url` and `token`. The package reads only `url`, to know the till is connected (the
  setup watcher); it never shows or copies the token. The till prefers it over `--ops-url`.
- **`invite`** and **`till-pos-token`** (plain text, `main` volume): written by the till
  (`join`, `till pair`, `till serve`); the package only reads them (the setup watcher and the
  health checks). Removing `till-pos-token` is how **Rotate POS token** works.
- **`till-pay-token`** (plain text, `main` volume, 0600): written only by `till pair --scope pay`
  (made if missing; `--new-token` replaces it). `till serve` reads it at start and never makes
  it, which is why **Turn on pay by card** makes it before the flag changes and **Rotate pay
  token** replaces it in place rather than deleting it. The package reads it for the Pay by card
  check and to confirm the running till takes it before **Pair a paying app** shows a code.
- `till-claim.json` is written by `till claim` and read and deleted by `till serve`; the package
  does not read it (the Registry check asks the till instead).

Other flags on every start: `--listen 0.0.0.0:9877`, `--require-pos-token`; `--pay-enabled`
while `payEnabled` is true. The other `--pay-*` limits are left at upstream's defaults.

## Dependencies

None. The till reaches its federation's guardians and Lightning gateways, the registry and
mempool.space over the internet itself.

## Network Access and Interfaces

The admin page builds the POS pairing code from the **Till API** interface. It prefers a public HTTPS domain, then a LAN route. A change of preferred origin restarts the daemon with the newly advertised address.

The **Till admin** UI has its own host and port 9878. The per-install admin password is stored on the main volume and displayed through the masked StartOS action.

StartOS terminates TLS for both interfaces. Open the HTTPS address for Till admin.

| Interface | Type | Port | Protocol | Purpose |
| --- | --- | --- | --- | --- |
| `admin` (Till admin) | `ui` | 9878 | HTTP behind StartOS TLS | Merchant sign-in, setup, sales, payout settings and withdrawals |
| `till` (Till API) | `api` | 9877 | HTTP, WebSocket upgrade on `/v1/card/link` | The POS apps' REST calls, a paying app's pay routes, and the card link that carries a tapped card's APDUs |

Phones away from the merchant's network need a public domain on this interface with a
certificate they trust (Let's Encrypt). The pairing text carries `https://<domain>`; the phone
derives `wss://` for the card link from it. A charge can block for up to two minutes, and the card
link lives up to two minutes.

The pay token (`fedimintcard-till-pay:<url>?t=<token>`) opens `POST /v1/pay`,
`GET /v1/pay/{id}` (only with the pay's `client_ref`), `POST /v1/pay/{id}/refund`,
`GET /v1/health` and the card link, and answers 403 on every other route, loopback included
(upstream `docs/TILL-API.md`, "The pay scope"). A pay or refund with it must name its own card
link. With pay by card off, `POST /v1/pay` answers `503 pay_disabled`; the other pay routes still
answer, so a paired app can look up and refund a payment made before. A paying app is offered
only the interface's public https domains: the Forge app refuses plain http to another computer.

## Installation and First-Run Flow

Choose the signed `.s9pk` for the server’s processor from the [Card 4.0 release](https://github.com/fedimintcard/fedimintcard/releases/tag/till-v0.1.0). For an upgrade, back up the existing service and sideload the package over it. Start the service and copy its generated password using **Show admin password**. Open the **Till admin** interface and complete setup in the browser. The original actions also remain available. An operator who uses **Join federation** as an action must stop the service first. The browser joins an unconfigured till while the process is running.

## Actions

The Actions tab includes the following controls.

- **Show admin password** displays the per-install password as a masked value.

- **Join federation**: once, at setup. Writes `mnemonic`, `client.db` and `invite` in `main`.
  Takes a few seconds (it downloads the federation's config from a guardian). Refuses when
  `invite` exists: a till never changes federations. If it fails partway, `mnemonic` may already
  exist; a second run reuses it.
- **Connect to registry**: at setup, after an expired claim, and after the operator revoked
  this till (charges then fail with `ops_refused`). Inputs: the till's name (default
  `StartOS till`, what the operator sees and what `GET /tills` lists) and the registry URL.
  Stores the URL in `store.json` and runs `till claim --text --replace`: writes `till-claim.json`
  (replacing any earlier claim) and returns the QR text with a QR code, and the code. Safe while
  the till runs and safe to repeat; a connected till keeps its token until the new claim is
  approved. Disabled until the till has joined a federation. Upstream's
  `registry/scripts/new-till.sh` (a token made on the operator's computer) still works for tills
  run from the command line; this package no longer takes a pasted token.
- **Pair a POS**: whenever a POS phone needs pairing. Runs `till pair --text --url <address>`:
  makes the POS token if there is none, changes nothing else, and is safe while the till runs.
  Returns the `fedimintcard-till:<url>?t=<token>` text, masked, with a QR code. Offers the
  interface’s public HTTPS domains first, then local network names and IP addresses. When a public domain is absent, a published mDNS name is the default. The action also lists enabled VPN addresses for phones using that VPN.
- **Rotate POS token**: when a POS phone is lost or its code leaked. Deletes `till-pos-token`;
  the till makes a new one at its next start, and every POS phone has to pair again. The pay
  token is not touched. Instant. Repeating it before a start does nothing more.
- **Turn on pay by card** / **Turn off pay by card**: one action whose name follows `payEnabled`.
  Turning on runs `till pair --scope pay --text --url http://127.0.0.1:9877` (makes the pay
  token, and the POS token, if missing; the printed text is thrown away), then sets `payEnabled`;
  turning off only clears it. Either way a running till restarts with or without
  `--pay-enabled`. Turning off keeps the pay token, so paired apps can still look up and refund
  earlier payments; **Rotate pay token** is what unpairs them.
- **Pair a paying app**: disabled until pay by card is on. Input: one of the interface's public
  https domains (disabled if there is none). Runs `till pair --scope pay --text --url <address>`,
  then calls `GET /v1/health` on the running till with the pay token and refuses to show the
  code if the till answers 401 (it started before the token existed; restart). A stopped till is
  not checked. Returns `fedimintcard-till-pay:<url>?t=<token>`, masked, with a QR code. The POS
  apps refuse this text (they take only `fedimintcard-till:`).
- **Rotate pay token**: service stopped only; disabled until a pay token exists. Runs
  `till pair --scope pay --new-token`, which replaces `till-pay-token` in place; the till takes it
  at its next start and every paying app must pair again. POS phones stay paired.

## Tasks

Once joined, a till without a registry token offers **Connect to registry** as an important task. Browser setup is available before federation join. An upgrade clears the old critical join task.

## Health Checks

Two checks, and a third while pay by card is on.

- **Till** checks the admin listener's `/healthz` before setup. After joining, it uses `GET /v1/status` on `127.0.0.1:9877` with the POS token as a bearer, every 30 s
  once healthy. Grace period 60 s: before listening, the till opens its federation client and
  reports to the registry, both over the network. Success shows the federation's name.
  - *Open Till admin to join a federation* means the service is ready for first setup. *Joining the federation* and *Opening the saved till wallet* report progress. If the federation has yet to confirm wallet support, leave the till running while it retries.
  - If the check says the federation needs a supported Bitcoin mint, open **Till admin** for the wallet details. If it says *The till is not answering*, open the service logs to identify the cause.
  - *The till answered HTTP 401*: `till-pos-token` changed after the till started (a rotation
    while it ran by hand); restart the service.
- **Registry**: the same `/v1/status`, its `ops_state`, once the till is ready.
  - *Connected (federation …)*: on ops.
  - *Waiting for approval in the provisioner app (code …)* (loading): a claim is live; approve it
    in the app before it expires.
  - *The request expired before it was approved*: run **Connect to registry** again.
  - *Not connected to a registry*: no token and no claim; run **Connect to registry**.

  A revoked till token still reads *Connected*: the till logs `could not report the federation's
  name and mint keys to ops` at startup and every charge fails with `ops_refused`. Run **Connect
  to registry** and approve the new claim.
- **Pay by card** (only while `payEnabled`), once the till is ready: `GET /v1/health` with the pay
  token, then `POST /v1/pay` with body `{}` and the POS token, which the till refuses before it
  looks at any card or invoice.
  - *On: paired apps can pay with a card*: the pay token is taken and the probe answers
    `400 bad_request`.
  - *There is no pay token*: `till-pay-token` is missing or empty; turn pay by card off and on.
  - *The till does not take the current pay token*: the till started before the token was made or
    replaced; restart the service.
  - *The till started with pay by card off*: the probe answered `503 pay_disabled`; restart.
  - *The till cannot pay Lightning invoices*: `503 lightning_unavailable` at the route, which means
    the federation has no Lightning module the wallet can use. Every payment would be refused.
  - A gateway that is down or a registry that is unreachable is not seen here: each refuses a
    payment before the card is charged, with its own error code.

## Backups and Restore

Both volumes are copied whole (`ofVolumes('main', 'startos')`); StartOS stops the till for the
backup. A restore brings back the wallet (mnemonic and client database), the card state the till
holds locally, the sales ledger, the POS token (paired phones keep working), the pay token and
`pays.json` (paired paying apps keep working, and payments still open are settled), the pay by
card setting (`store.json`) and the registry settings (the till token is in `main`, so a restored
till stays connected).

`offline_queue.json` is in `main`, so a backup taken while payments wait to be sent keeps them;
restoring an older backup loses the payments taken offline after it (the cards have already
spent those notes). Back up after the queue is empty when you can (`/v1/status`
`offline.queued: 0`). A card with such a lost payment keeps paying: at its next online tap the
till holds the slots that payment used as stranded (upstream `docs/TILL-API.md`, "Stranded
slots").

`offline_pool.json` holds the secrets behind the offline kits the till hands to POS phones. A
restore from a backup taken before a kit was handed out leaves the till not knowing that kit: the
payments a phone took with it stay on the phone, waiting, until the phone syncs to a till that
knows them. Back up after the phones have synced when you can (`offline.queued: 0` on
`/v1/status`, and no payments waiting in the POS app's Settings).

The card state that matters lives in the registry, not on the box: a restored till reloads each
card from ops on its next tap. Finish pending payouts and record the last sale and payout before a backup. Keep the original till stopped during restore. A stale restore can resume automatic payouts against outdated records. Reconcile later activity before starting the restored till. Restoring an old backup of the wallet loses the eCash the till
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
5. Each architecture requires its corresponding image in the release index.
6. Offline payments (upstream `docs/OFFLINE-PROTOCOL.md`) use upstream's defaults: up to 100,000
   sat and 200 payments unsettled, 12 spare slots kept per card, a fee margin of 100 msat per
   input and output on federations at core consensus 2.1, block headers from mempool.space. The
   package does not expose these as settings. POS phones offline (upstream `docs/POS-OFFLINE.md`)
   use the defaults too: an offline kit lasts a week (`--offline-kit-ttl-hours` 168) and the
   payments taken with it are accepted for 30 days after (`--offline-kit-grace-days`); a phone's
   offline payments count toward the till's limits above.
7. Paying a Lightning invoice with a card (upstream `docs/PAY.md`) is off until **Turn on pay by
   card**, and then uses upstream's default limits, which the package does not expose: invoices
   up to 100,000 sat, a fee reserve capped at 1,000 sat, no margin, 1,000,000 sat charged for
   payments in any 24 hours, and at least 120 s left on an invoice. Upstream keeps the part of
   the fee reserve the gateway did not use in the till's wallet; it is not put back on the card.
   A payment needs the till on its registry (the holder's PIN is then required), the federation
   and a Lightning gateway: there is no paying offline.

---

## Quick Reference for AI Consumers

```yaml
package_id: fedimintcard-till
image: upstream till release index (local OCI archive for testing)
architectures: [x86_64, aarch64]
subcontainers: [till]
volumes:
  main: /data
  startos: (not mounted)
file_models:
  - main/admin-password
  - startos/store.json
  - main/invite (read only)
  - main/till-pos-token (read only)
  - main/till-pay-token (read; made and replaced through till pair --scope pay)
  - main/till-ops.json (read only, url only)
startos_managed_flags:
  - --admin-listen
  - --admin-password-file
  - --ops-url
  - --listen
  - --require-pos-token
  - --pay-enabled (only while store.json payEnabled is true)
dependencies: none
interfaces:
  till: { type: api, port: 9877 }
  admin: { type: ui, port: 9878 }
actions:
  - show-admin-password
  - join-federation
  - connect-registry
  - pair-pos
  - rotate-pos-token
  - pay-by-card
  - pair-pay-app
  - rotate-pay-token
tasks:
  - { action: connect-registry, severity: important }
health_checks:
  - till
  - registry
  - pay (only while pay by card is on)
```
