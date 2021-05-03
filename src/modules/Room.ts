import { RCRTCCode } from '@rongcloud/plugin-rtc'
import { IJoineResult } from '../interfaces/IJoinedData'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IRoomInitOptions {
  id: string
  joined? (): void
  left? (user: { id: string }): void
  kick? (user: { id: string }): void
}

export interface RoomInfo { id: string, total: number }

export class Room extends BasicModule {
  private readonly _options: IRoomInitOptions
  constructor (options: IRoomInitOptions) {
    super()
    this._options = { ...options }
  }

  async join (): Promise<IJoineResult> {
    return this._ctrl.join(this._options.id)
  }

  leave () {
    return this._ctrl.leaveRoom()
  }

  async get (): Promise<RoomInfo | any> {
    logger.error('todo -> Room.get')
    throw new Error('todo -> Room.get')
  }
}
