# Updating the upstream version

## Determining the upstream version

The application is the fedimintcard repository, pinned as the `upstream-project` git submodule;
the image builds `card-sidecar` from its `host/` workspace (`Dockerfile`). Upstream has no
releases or tags, so the pin is a commit on `main`:

```bash
git -C upstream-project fetch origin
git -C upstream-project log --oneline HEAD..origin/main -- host
```

The upstream version is `version` under `[workspace.package]` in
`upstream-project/host/Cargo.toml`.

Two base images are pinned by digest in the `Dockerfile`: the Rust builder (its release must match
`upstream-project/host/rust-toolchain.toml`) and `debian:bookworm-slim` for the runtime. Read a
tag's current digest with `docker buildx imagetools inspect <image>:<tag>`.

## Applying the bump

1. `git -C upstream-project checkout <commit>` and stage the submodule (`git add upstream-project`).
2. If `rust-toolchain.toml` moved, change the builder to `rust:<that release>-bookworm` and its
   digest. Keep the runtime on the same Debian release as the builder (the binary links against
   the builder's glibc).
3. Set `version` in `startos/versions/current.ts` to the upstream version from step 1.
