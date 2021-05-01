import { RCRTCClient } from '@rongcloud/plugin-rtc'
import logger from '../logger'
import { RTCClientCtrl } from '../RTCClientCtrl'

export class BasicModule {
  protected readonly _ctrl!: RTCClientCtrl
  protected readonly _client!: RCRTCClient

  constructor () {
    const ctrl = RTCClientCtrl.getInstance()
    if (!ctrl) {
      logger.error(`${__NAME__} not initialize yet`)
      return
    }
    this._ctrl = ctrl
    this._ctrl.on(RTCClientCtrl.__INNER_EVENT_DESTROY__, this.onDestroy, this)
  }

  protected getCrtRoom () {
    return this._ctrl.getCrtRoom()
  }

  private onDestroy () {
    throw new Error('TODO -> BasicModule onDestroy')
  }
}
