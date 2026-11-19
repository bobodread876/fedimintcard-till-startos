import { sdk } from '../sdk'
import { connectRegistry } from './connectRegistry'
import { joinFederation } from './joinFederation'
import { pairPayApp } from './pairPayApp'
import { pairPos } from './pairPos'
import { payByCard } from './payByCard'
import { rotatePayToken } from './rotatePayToken'
import { rotatePosToken } from './rotatePosToken'

export const actions = sdk.Actions.of()
  .addAction(joinFederation)
  .addAction(connectRegistry)
  .addAction(pairPos)
  .addAction(rotatePosToken)
  .addAction(payByCard)
  .addAction(pairPayApp)
  .addAction(rotatePayToken)
