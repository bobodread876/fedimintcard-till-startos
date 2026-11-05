import { sdk } from '../sdk'
import { connectRegistry } from './connectRegistry'
import { joinFederation } from './joinFederation'
import { pairPos } from './pairPos'
import { rotatePosToken } from './rotatePosToken'

export const actions = sdk.Actions.of()
  .addAction(joinFederation)
  .addAction(connectRegistry)
  .addAction(pairPos)
  .addAction(rotatePosToken)
