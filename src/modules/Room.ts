import { RCMediaType, RCRTCCode, RCTrack } from '@rongcloud/plugin-rtc'
import { IJoineResult } from '../interfaces/IJoinedData'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IRoomInitOptions {
  id: string
  joined? (user: { id: string }): void
  left? (user: { id: string }): void
  kick? (): void
}

export interface IUserState { mediaType: RCMediaType, state: 0 | 1, tag: string }

export interface RoomInfo { id: string, total: number }

export class Room extends BasicModule {
  private readonly _options: IRoomInitOptions
  constructor (options: IRoomInitOptions) {
    super()
    this._options = { ...options }
    this._ctrl.onUserJoin = (ids) => {
      logger.info(`onUserJoin -> ${ids.join(', ')}`)
      ids.forEach(id => options.joined?.({ id }))
    }
    this._ctrl.onUserLeave = (ids) => {
      logger.info(`onUserLeave -> ${ids.join(', ')}`)
      ids.forEach(id => options.left?.({ id }))
    }
    this._ctrl.onKickOff = () => {
      logger.info('onKickOff ->')
      options.kick?.()
    }
  }

  async join (): Promise<IJoineResult> {
    return this._ctrl.join(this._options.id)
  }

  leave () {
    return this._ctrl.leaveRoom()
  }

  async get (): Promise<RoomInfo> {
    return this._ctrl.checkRoomThen(async (room) => {
      const id = this._options.id
      const total = room.getRemoteUserIds().length + 1
      const { code, data } = await room.getRoomAttributes([])
      if (code === RCRTCCode.SUCCESS) {
        return { ...data, id, total }
      }
      return { id, total }
    })
  }

  getSessionId () {
    return this._ctrl.checkRoomThen(async room => {
      return room.getSessionId()
    })
  }

  getStats (): Promise<{ [userId: string]: IUserState[] }> {
    return this._ctrl.checkRoomThen(async (room, crtUserId) => {
      const data: { [userId: string]: IUserState[] } = {}
      const trans = (item: RCTrack): IUserState => {
        return {
          tag: item.getTag(),
          state: item.isLocalMuted() || item.isOwnerMuted() ? 0 : 1,
          mediaType: item.isAudioTrack() ? RCMediaType.AUDIO_ONLY : RCMediaType.VIDEO_ONLY
        }
      }
      room.getRemoteUserIds().forEach(userId => {
        data[userId] = room.getRemoteTracksByUserId(userId).map(trans)
      })
      data[crtUserId] = room.getLocalTracks().map(trans)
      return data
    })
  }
}
