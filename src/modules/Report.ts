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
    this._ctrl.onReportListener = (report: IRCRTCStateReport) => {
      const { receivers, senders } = report
      const { spoke } = this._options
      if (!spoke) {
        return
      }
      const arrTracks: { id: string, stream: { audioLevel: number }}[] = senders
        .filter(item => item.kind === 'audio')
        .map(item => ({ stream: { audioLevel: item.audioLevel! }, id: parseUserId(item.trackId) }))
      arrTracks.push(...receivers.filter(item => item.kind === 'audio').map(item => ({ stream: { audioLevel: item.audioLevel! }, id: parseUserId(item.trackId) })))
      arrTracks.forEach(spoke)
    }
  }

  /**
   * @deprecated
   */
  start (options?: IReportStartOptions) {
    logger.warn('`Report.start()` has been deprecated.')
  }
}
