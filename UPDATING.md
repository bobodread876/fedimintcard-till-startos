# Updating the till image

The upstream image workflow publishes `ghcr.io/fedimintcard/till` under an immutable commit tag for a reviewed main build or a version tag for an owner-tagged release. Read the image tag, source commit and index digest from the completed upstream workflow.

1. Run `python3 scripts/pin-image.py IMAGE_TAG sha256:RELEASE_INDEX_DIGEST --revision FULL_COMMIT_SHA`. Use the owner’s X.Y.Z image tag or the immutable sha-FULL_COMMIT_SHA tag. This verifies the registry index and both architectures’ embedded source revisions and writes the digest-pinned image reference in `startos/manifest/tillImage.ts`.
2. Set the package version and release notes in `startos/versions/current.ts`. Check the root license against the upstream tag.
3. Build x86 and arm packages. Install on a disposable StartOS instance, verify browser setup on a clean wallet, and test an upgrade from the previous package against a disposable existing wallet. Check sign-in, sales, pairing, payout recovery and backup restore before release.

For an unpublished build, use the OCI source in `startos/manifest/tillImage.ts` and create the archive from the upstream repository:

```sh
docker buildx build --platform linux/amd64,linux/arm64 --output type=oci,dest=/path/to/package/till.oci.tar .
```

The archive stays local. Before publishing, replace the test source using the release pin script.

The pull request workflow builds each architecture with a temporary key on an isolated runner. The release workflow uses the repository's configured maintainer signing secret (`DEV_KEY`). An authorized maintainer tags the package separately from the upstream till tag. A GitHub release with the signed packages is sufficient for sideloading. Set a release registry only when publishing there is intended.
