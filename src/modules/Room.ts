import { RCRTCCode } from '@rongcloud/plugin-rtc'
import { IJoineResult } from '../interfaces/IJoinedData'
import { BasicModule } from './Basic'

export interface IRoomInitOptions {
  id: string
  joined? (user: { id: string }): void
  left? (user: { id: string }): void
  kick? (): void
}

export interface RoomInfo { id: string, total: number }

export class Room extends BasicModule {
  private readonly _options: IRoomInitOptions
  constructor (options: IRoomInitOptions) {
    super()
    const _this = this
    this._options = { ...options }
    this._ctrl.registerRoomEventListener({
      onUserJoin (ids) {
        ids.forEach(id => options.joined?.({ id }))
      },
      onUserLeave (ids) {
        ids.forEach(id => options.left?.({ id }))
      },
      onKickOff (byServer) {
        options.kick?.()
      }
    })
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
}
