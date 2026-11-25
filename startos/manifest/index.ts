import { tillImage } from './tillImage'
import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'fedimintcard-till',
  title: 'Fedimint Card 4.0 Till',
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
      source: tillImage,
      arch: ['x86_64', 'aarch64'],
      emulateMissing: false,
    },
  },
})
