import { EventEmitter } from '@rongcloud/engine'
import { RCRTCClient } from '@rongcloud/plugin-rtc'
import { IRTCAdapterOptions } from './interfaces/IRTCAdapterOptions'

export class RTCClientCtrl extends EventEmitter {
  private static _instance: RTCClientCtrl | null = null
  static __INNER_EVENT_DESTROY__: string = 'inner-destroy'

  static init (options: IRTCAdapterOptions) {
    this._instance = new RTCClientCtrl(options)
  }

  static destroy () {
    if (this._instance) {
      this._instance.destroy()
      this._instance = null
    }
  }

  static getInstance () {
    return this._instance
  }

  private readonly _client: RCRTCClient

  constructor (options: IRTCAdapterOptions) {
    super()

    this._client = options.client
  }

  private destroy () {
    this.emit(RTCClientCtrl.__INNER_EVENT_DESTROY__)
  }
}
