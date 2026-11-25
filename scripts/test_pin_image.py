import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


REVISION = "1" * 40
REPO = "ghcr.io/fedimintcard/till"
ARCH_DIGEST = {"arm64": "sha256:" + "a" * 64, "amd64": "sha256:" + "b" * 64}

class PinImageTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        scripts = self.root / "scripts"
        scripts.mkdir()
        self.program = scripts / "pin-image.py"
        shutil.copyfile(Path(__file__).with_name(self.program.name), self.program)
        self.source = self.root / "startos/manifest/tillImage.ts"
        self.source.parent.mkdir(parents=True)
        self.source.write_text("original verified source")
        self.index = self.root / "index.json"
        docker = scripts / "docker"
        docker.write_text("""#!/bin/sh
case "$4" in
    --raw) cat "$TEST_INDEX" ;;
    --format) case "$6" in
        *@sha256:a*) cat "$TEST_INDEX.arm64" ;;
        *@sha256:b*) cat "$TEST_INDEX.amd64" ;;
        *) exit 2 ;;
    esac ;;
    *) exit 2 ;;
esac
""")
        docker.chmod(0o700)
        self.environment = dict(os.environ, PATH=str(scripts) + ":" + os.environ["PATH"], TEST_INDEX=str(self.index))

    def run_with(self, platforms, supplied_digest=None, wrong_arch=False, image_tag="1.2.3"):
        for arch in platforms:
            config = {"os": "linux", "architecture": arch, "config": {"Labels": {
                "org.opencontainers.image.revision": "2" * 40 if wrong_arch and arch == "arm64" else REVISION,
                "org.opencontainers.image.source": "https://github.com/fedimintcard/fedimintcard",
            }}}
            Path(str(self.index) + "." + arch).write_text(json.dumps(config))
        self.index.write_text(json.dumps({"manifests": [
            {"platform": {"os": "linux", "architecture": arch}, "digest": ARCH_DIGEST[arch]} for arch in platforms
        ]}))
        digest = "sha256:" + hashlib.sha256(self.index.read_bytes()).hexdigest()
        result = subprocess.run(
            [sys.executable, str(self.program), image_tag, supplied_digest or digest, "--revision", REVISION],
            capture_output=True, env=self.environment, text=True,
        )
        return result, digest

    def test_pins_verified_release_index(self):
        result, digest = self.run_with(["amd64", "arm64"])
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("ghcr.io/fedimintcard/till:1.2.3@" + digest, self.source.read_text())

    def test_sha_tag_and_both_architecture_revisions(self):
        result, digest = self.run_with(["amd64", "arm64"], image_tag="sha-" + REVISION)
        self.assertEqual(result.returncode, 0, result.stderr)
        pinned = self.source.read_text()
        self.assertIn(REPO + ":sha-" + REVISION + "@" + digest, pinned)
        result, _ = self.run_with(["amd64", "arm64"], wrong_arch=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.source.read_text(), pinned)

    def test_incomplete_or_changed_index_preserves_source(self):
        for platforms, supplied in [(["arm64"], None), (["amd64", "arm64"], "sha256:" + "0" * 64)]:
            with self.subTest(platforms=platforms, supplied=supplied):
                result, _ = self.run_with(platforms, supplied)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(self.source.read_text(), "original verified source")


if __name__ == "__main__":
    unittest.main()
