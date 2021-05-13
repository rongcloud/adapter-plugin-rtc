import logger from '../logger'
import { RTCClientCtrl } from '../RTCClientCtrl'

export class BasicModule {
  protected readonly _ctrl!: RTCClientCtrl

  constructor () {
    const ctrl = RTCClientCtrl.getInstance()
    if (!ctrl) {
      logger.error(`${__NAME__} not initialize yet`)
      return
    }
    this._ctrl = ctrl
    this._ctrl.on(RTCClientCtrl.__INNER_EVENT_DESTROY__, this.onDestroy, this)
  }

  protected onDestroy () {
  }
}
