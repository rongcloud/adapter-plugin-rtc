import logger from '../logger'
import { RTCClientCtrl } from '../RTCClientM'

export class BasicModule {
  protected _ctrl?: RTCClientCtrl
  constructor () {
    const ctrl = RTCClientCtrl.getInstance()
    if (!ctrl) {
      logger.error(`${__NAME__} is not initialize yet`)
      return
    }
    this._ctrl = ctrl
    this._ctrl.on(RTCClientCtrl.__INNER_EVENT_DESTROY__, this.onDestroy, this)
  }

  private onDestroy () {}
}
