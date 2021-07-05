import { IRCRTCStateReport } from '@rongcloud/plugin-rtc'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IReportInitOptions {
  spoke? (user: { id: string, stream: { audioLevel: number } }): void
}

export interface IReportStartOptions {
  /**
   * @deprecated
   */
  frequency: number
}

const parseUserId = (trackId: string) => {
  return trackId.replace(/_[^_]+_[01]+(_tiny)?$/g, '')
}

export class Report extends BasicModule {
  private readonly _options: IReportInitOptions
  constructor (options: IReportInitOptions) {
    super()
    this._options = { ...options }
    const { spoke } = this._options
    if (!spoke) {
      return
    }
    this._ctrl.onReportSpokeListener = spoke
  }

  /**
   * @deprecated
   */
  start (options?: IReportStartOptions) {
    this._ctrl.startAudioLevelChangeEvent(options?.frequency)
  }
}
