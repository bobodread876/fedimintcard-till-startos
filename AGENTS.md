# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- **Keep `--require-pos-token` in `main.ts`, and pass the till's settings as flags, not `exec.env`.** The env did not reach the process on zion (the till came up on loopback with no POS token). Every request reaches the till through StartOS's proxy from a local address, so without it the till would exempt them all from the POS token.
- **Keep Join federation refusing once `invite` exists.** `mnemonic` and `client.db` hold the till's takings, and upstream never tried `join` over a joined data directory.
- **Keep the Connect to registry task `important`, never `critical`.** The till picks up its token by polling while it runs; a critical task would hold it stopped and the claim would expire unapproved.
- **Change the till's flags upstream, not here.** `--require-pos-token`, `till pair --text` and `--url https://` live in fedimintcard's `host/sidecar`; bump the `upstream-project` submodule to get a change.
