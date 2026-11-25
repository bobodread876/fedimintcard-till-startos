# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- **Keep `--require-pos-token` in `main.ts` and pass the till settings as command-line flags.** The POS listener requires the phone's pairing token on requests through the StartOS proxy.
- **Keep Join federation refusing once `invite` exists.** `mnemonic` and `client.db` hold the till's takings, and upstream never tried `join` over a joined data directory.
- **Keep the Connect to registry task `important`, never `critical`.** The till picks up its token by polling while it runs; a critical task would hold it stopped and the claim would expire unapproved.
- **Make the pay token before `--pay-enabled` goes on, and replace it in place (`till pair --scope pay --new-token`), never delete it as Rotate POS token deletes its token.** `till serve` reads `till-pay-token` only at start and never makes it, so a till started without it refuses every paying app until a pairing and another restart.
- **Change the till's flags upstream, not here.** `--require-pos-token`, `till pair --text` and `--url https://` live in fedimintcard's `host/sidecar`; pin the reviewed multiarchitecture GHCR release with `scripts/pin-image.py` to get a change.
