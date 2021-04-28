import { RCRTCCode } from '@rongcloud/plugin-rtc'
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

  async join () {
    logger.error('todo -> join')
    const { code } = await this._ctrl.join(this._options.id)
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject(code)
    }
    return Promise.resolve()
  }

  async leave () {
    logger.error('todo -> leave')
  }

  async get (): Promise<RoomInfo | any> {
    logger.error('todo -> get')
    throw new Error('todo')
  }
}
