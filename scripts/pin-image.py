#!/usr/bin/env python3
"""Pin a released GHCR index after checking its digest and required architectures."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("version")
parser.add_argument("digest")
parser.add_argument("--revision", required=True, help="full reviewed upstream commit SHA")
args = parser.parse_args()
if not re.fullmatch(r"[0-9a-f]{40}", args.revision):
    parser.error("expected the full reviewed source commit")
if not re.fullmatch(r"(0|[1-9][0-9]*)(\.(0|[1-9][0-9]*)){2}", args.version) and args.version != "sha-" + args.revision:
    parser.error("expected an x.y.z version or sha- followed by the reviewed source commit")
if not re.fullmatch(r"sha256:[0-9a-f]{64}", args.digest):
    parser.error("expected the release index digest")
ref = f"ghcr.io/fedimintcard/till:{args.version}"
raw = subprocess.check_output(["docker", "buildx", "imagetools", "inspect", "--raw", ref])
if "sha256:" + hashlib.sha256(raw).hexdigest() != args.digest:
    parser.error("the image index differs from the release digest")
repo = "ghcr.io/fedimintcard/till"
arches = set()
for entry in json.loads(raw).get("manifests", []):
    platform = entry.get("platform", {})
    arch = platform.get("architecture")
    if platform.get("os") != "linux" or arch not in {"amd64", "arm64"}:
        continue
    if arch in arches or not re.fullmatch(r"sha256:[0-9a-f]{64}", entry.get("digest", "")):
        parser.error("missing or ambiguous platform digest")
    image = json.loads(subprocess.check_output([
        "docker", "buildx", "imagetools", "inspect", "--format", "{{json .Image}}", repo + "@" + entry["digest"]
    ]))
    labels = image.get("config", {}).get("Labels", {})
    if (image.get("os"), image.get("architecture")) != ("linux", arch) or labels.get("org.opencontainers.image.revision") != args.revision:
        parser.error(f"{arch} does not match the reviewed platform and commit")
    if labels.get("org.opencontainers.image.source") != "https://github.com/fedimintcard/fedimintcard":
        parser.error(f"{arch} does not identify the upstream repository")
    arches.add(arch)
if arches != {"amd64", "arm64"}:
    parser.error("the index needs both linux/amd64 and linux/arm64 images")
output = Path(__file__).resolve().parents[1] / "startos/manifest/tillImage.ts"
output.write_text("export const tillImage = { dockerTag: '" + ref + "@" + args.digest + "' } as const\n")
