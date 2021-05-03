import { EventEmitter } from '@rongcloud/engine'
import { IRCRTCReportListener, IRoomEventListener, RCLivingRoom, RCAbstractRoom, RCLivingType, RCRTCClient, RCRTCCode, RCRTCRoom, IRCRTCStateReport } from '@rongcloud/plugin-rtc'
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
  private _room?: RCAbstractRoom

  constructor (private _options: IRTCAdapterOptions) {
    super()

    this._client = _options.client
  }

  getRTCClient () {
    return this._client
  }

  getRTCMode () {
    return this._options.mode || Mode.RTC
  }

  getLiveRole () {
    return this._options.liveRole
  }

  getLiveType () {
    return this._options.liveType
  }

  /**
   * 确认房间存在后执行相应回调
   * @param callback
   * @returns
   */
  async checkRoomThen<T> (callback: (room: RCAbstractRoom) => Promise<T>): Promise<T> {
    if (!this._room) {
      return Promise.reject({ code: RCRTCCode.NOT_IN_ROOM })
    }
    return callback(this._room)
  }

  async checkAuchorThen<T> (callback: (room: RCLivingRoom) => Promise<T>): Promise<T> {
    const mode = this.getRTCMode()
    const role = this.getLiveRole()

    if (mode !== Mode.LIVE || role !== ROLE.ANCHOR) {
      return Promise.reject({ code: RCAdapterCode.NOT_AUCHOR })
    }

    if (!this._room) {
      return Promise.reject({ code: RCRTCCode.NOT_IN_ROOM })
    }

    const livingRoom: RCLivingRoom = this._room as RCLivingRoom
    return callback(livingRoom)
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
    logger.error('todo -> RCClientCtrl.becameAuchor')
  }

  public registerRoomEventListener (listener: IRoomEventListener) {
    const tmp: any = listener
    Object.keys(listener).forEach(key => tmp[key] && this.on(key, tmp[key]))
  }

  public registerReportListener (listener: IRCRTCReportListener) {
    const tmp: any = listener
    Object.keys(listener).forEach(key => tmp[key] && this.on(key, tmp[key]))
  }

  private _setCrtRoom (room: RCRTCRoom) {
    const _this = this
    this._room = room
    room.registerReportListener({
      onStateReport (report) {
        _this.emit('onStateReport', report)
      }
    })
    room.registerRoomEventListener({
      onUserJoin (userIds) {
        _this.emit('onUserJoin', userIds)
      },
      onUserLeave (userIds) {
        _this.emit('onUserLeave', userIds)
      },
      onKickOff (byServer) {
        _this.emit('onKickOff', byServer)
      },
      onMessageReceive (name, content) {
        _this.emit('onMessageReceive', name, content)
      },
      onTrackPublish (track) {
        _this.emit('onTrackPublish', track)
      },
      onTrackUnpublish (track) {
        _this.emit('onTrackUnpublish', track)
      },
      onTrackReady (track) {
        _this.emit('onTrackReady', track)
      },
      onAudioMuteChange (track) {
        _this.emit('onAudioMuteChange', track)
      },
      onVideoMuteChange (track) {
        _this.emit('onVideoMuteChange', track)
      },
      onRoomAttributeChange (name, content) {
        _this.emit('onRoomAttributeChange', name, content)
      }
    })
  }

  private destroy () {
    this.emit(RTCClientCtrl.__INNER_EVENT_DESTROY__)
    this.clear()
  }
}
