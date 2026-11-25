import { lchown, lstat, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const walletOwner = 1000

/** Upgrade older root-owned volumes while the package is initializing. */
export async function prepareWalletOwnership(volume: string): Promise<void> {
  const root = await lstat(volume)
  if (!root.isDirectory())
    throw new Error('The wallet volume must be a directory')
  if (root.uid === walletOwner && root.gid === walletOwner) return

  async function visit(path: string): Promise<void> {
    const entry = await lstat(path)
    // Never follow links or descend into a different mounted filesystem.
    if (entry.isSymbolicLink() || entry.dev !== root.dev) return
    if (entry.isDirectory()) {
      for (const name of await readdir(path)) await visit(join(path, name))
    }
    // Preserve non-root owners and the existing permissions and contents.
    if (entry.uid === 0 || entry.gid === 0) {
      await lchown(
        path,
        entry.uid === 0 ? walletOwner : -1,
        entry.gid === 0 ? walletOwner : -1,
      )
    }
  }
  // Changing the volume root last lets a failed migration resume on next start.
  await visit(volume)
}
