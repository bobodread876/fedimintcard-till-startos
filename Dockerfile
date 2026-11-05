# Fedimint Card Till: `card-sidecar` from the upstream-project submodule (fedimintcard's host/
# workspace), cross-compiled for x86_64 on the build machine's own architecture, so an arm64 Mac
# builds it natively instead of compiling fedimint under emulation. Bump the base images and the
# submodule as UPDATING.md describes.

FROM --platform=$BUILDPLATFORM rust:1.91.1-bookworm@sha256:c1e5f19e773b7878c3f7a805dd00a495e747acbdc76fb2337a4ebf0418896b33 AS build
ARG TARGETARCH
# The C/C++ parts (RocksDB, aws-lc, jemalloc, secp256k1, zstd, lz4, bzip2, zlib) need a compiler
# for x86_64; RocksDB's bindings need libclang on the build machine.
RUN set -eux; \
    [ "$TARGETARCH" = amd64 ] || { echo "this image builds for amd64 only, not $TARGETARCH" >&2; exit 1; }; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      gcc-x86-64-linux-gnu g++-x86-64-linux-gnu libc6-dev-amd64-cross clang libclang-dev cmake; \
    rm -rf /var/lib/apt/lists/*

ENV CARGO_TARGET_X86_64_UNKNOWN_LINUX_GNU_LINKER=x86_64-linux-gnu-gcc \
    CC_x86_64_unknown_linux_gnu=x86_64-linux-gnu-gcc \
    CXX_x86_64_unknown_linux_gnu=x86_64-linux-gnu-g++ \
    AR_x86_64_unknown_linux_gnu=x86_64-linux-gnu-ar \
    BINDGEN_EXTRA_CLANG_ARGS_x86_64_unknown_linux_gnu="--sysroot=/usr/x86_64-linux-gnu -I/usr/x86_64-linux-gnu/include" \
    PKG_CONFIG_ALLOW_CROSS=1

WORKDIR /src/host
COPY upstream-project/host ./
# The workspace pins its toolchain (rust-toolchain.toml); the base image ships the same release.
RUN rustup target add x86_64-unknown-linux-gnu
# fedimint is a git dependency pinned by commit in Cargo.lock; cargo fetches it over HTTPS.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/src/host/target \
    cargo build --locked --release --target x86_64-unknown-linux-gnu -p fedimint-card-sidecar --bin card-sidecar \
    && install -D -m 0755 target/x86_64-unknown-linux-gnu/release/card-sidecar /out/card-sidecar \
    && x86_64-linux-gnu-strip /out/card-sidecar

FROM debian:bookworm-slim@sha256:99c0b25c46d0214d5a2091092e7908907dcaecd6a962cde0ac700acee222b6f3
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /out/card-sidecar /usr/local/bin/card-sidecar
COPY upstream-project/LICENSE /usr/share/doc/fedimint-card/LICENSE
RUN card-sidecar --help >/dev/null
ENV CARD_DATA_DIR=/data
