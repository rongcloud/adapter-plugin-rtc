import { EventEmitter } from '@rongcloud/engine'
import { RCLivingRoom, RCLivingType, RCRTCClient, RCRTCCode, RCRTCRoom } from '@rongcloud/plugin-rtc'
import { RCAdapterCode, Mode, ROLE } from './enums'
import { IJoineResult } from './interfaces/IJoinedData'
import { IRTCAdapterOptions } from './interfaces/IRTCAdapterOptions'
import logger from './logger'

export class RTCClientCtrl extends EventEmitter {
  private static _instance: RTCClientCtrl | null = null
  static __INNER_EVENT_DESTROY__: string = 'inner-destroy'

  static init (options: IRTCAdapterOptions) {
    this._instance = new RTCClientCtrl(options)
  }

  static destroy () {
    this._instance!.destroy()
    this._instance = null
  }

  static getInstance () {
    return this._instance
  }

  private readonly _client: RCRTCClient
  private _room?: RCRTCRoom | RCLivingRoom

  constructor (private _options: IRTCAdapterOptions) {
    super()

    this._client = _options.client
  }

  getRTCClient () {
    return this._client
  }

  getCrtRoom () {
    return this._room
  }

  async join (roomId: string): Promise<IJoineResult> {
    let data
    if (this._options.mode === Mode.LIVE) {
      if (this._options.liveRole !== ROLE.ANCHOR) {
        return Promise.reject({ code: RCAdapterCode.ANDIENCE_CANNOT_JOIN_ROOM })
      }
      data = await this._client.joinLivingRoom(roomId, (this._options.liveType || 0) as RCLivingType)
    } else {
      data = await this._client.joinRTCRoom(roomId)
    }
    const { code } = data
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }

    const room = data.room!
    this._setCrtRoom(room)
    // 找出所有人员、资源，逐个通知业务层
    const users = room.getRemoteUserIds().map(id => ({ id }))
    return { users }
  }

  async leaveRoom () {
    const { code } = await this._client.leaveRoom(this._room!)
    if (code === RCRTCCode.SUCCESS) {
      return Promise.resolve()
    } else {
      return Promise.reject({ code })
    }
  }

  becameAuchor () {
    logger.error('todo -> becameAuchor')
  }

  private _setCrtRoom (room: RCRTCRoom) {
    room.registerReportListener({
      onStateReport (report) {
      }
    })
    room.registerRoomEventListener({
      onUserJoin (userIds) {},
      onUserLeave (userIds) {},
      onKickOff (byServer) {},
      onMessageReceive (name, content) {},
      onTrackPublish (track) {},
      onTrackUnpublish (track) {},
      onTrackReady (track) {},
      onAudioMuteChange (track) {},
      onVideoMuteChange (track) {},
      onRoomAttributeChange (name, content) {}
    })
  }

  private destroy () {
    this.emit(RTCClientCtrl.__INNER_EVENT_DESTROY__)
  }
}
