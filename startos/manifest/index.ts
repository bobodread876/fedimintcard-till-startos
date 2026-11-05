import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'fedimintcard-till',
  title: 'Fedimint Card Till',
  license: 'MIT',
  packageRepo: 'https://github.com/bobodread876/fedimintcard-till-startos',
  upstreamRepo: 'https://github.com/fedimintcard/fedimintcard',
  marketingUrl: 'https://fedimintcard.org',
  donationUrl: null,
  description: { short, long },
  // main: the till's wallet (mnemonic, federation client database, card state, sales).
  // startos: store.json (the registry URL), mounted by no subcontainer.
  volumes: ['main', 'startos'],
  images: {
    till: {
      // Built by ./Dockerfile from the upstream-project submodule; see UPDATING.md.
      source: { dockerBuild: { dockerfile: 'Dockerfile', workdir: '.' } },
      // The Dockerfile cross-compiles for x86_64 only (the owner's server); an aarch64 build
      // would need its own cross toolchain and has never been tried.
      arch: ['x86_64'],
      emulateMissing: false,
    },
  },
})
