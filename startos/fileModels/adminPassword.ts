import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

export const adminPassword = FileHelper.string({
  base: sdk.volumes.main,
  subpath: 'admin-password',
})
