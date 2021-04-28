import { EventEmitter } from '@rongcloud/engine'
import { RCLivingType, RCRTCClient } from '@rongcloud/plugin-rtc'
import { Mode } from './enums'
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

  constructor (private _options: IRTCAdapterOptions) {
    super()

    this._client = _options.client
  }

  join (roomId: string) {
    if (this._options.mode === Mode.LIVE) {
      return this._client.joinLivingRoom(roomId, (this._options.liveType || 0) as RCLivingType)
    }
    return this._client.joinRTCRoom(roomId)
  }

  private destroy () {
    this.emit(RTCClientCtrl.__INNER_EVENT_DESTROY__)
  }
}
