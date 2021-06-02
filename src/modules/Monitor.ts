import { IRCCandidatePairStat, IRCRTCStateReport, IRCTrackStat } from '@rongcloud/plugin-rtc'
import { BasicModule } from './Basic'

export type ITrackStat = {
  mediaType: string
  googTrackId: string
  /**
   * @deprecated
   */
  googCodecName: string
  audioLevel: string
  /**
   * @deprecated
   */
  samplingRate: string
  /**
   * @deprecated
   */
  trackReceived: string
  packLostReceivedRate: string
  frameRate: string
  resolution: string
  /**
   * @deprecated
   */
  googRenderDelayMs: string
  googJitterReceived: string
  /**
   * @deprecated
   */
  googNacksReceived: string
  /**
   * @deprecated
   */
  googPlisReceived: string
  googRtt: string
  /**
   * @deprecated
   */
  googFirsReceived: string
  /**
   * @deprecated
   */
  codecImplementationName: string
  /**
   * @deprecated
   */
  trackState: string
  streamId: string
}

export type ISenderData = {
  totalRate: number
  tracks: ITrackStat[]
  networkType: string,
  rtt: number
  receiveBand: number
  localAddress: string
  sendBand: number
  /**
   * @deprecated 丢包率需按流计算，不存在总丢包率
   */
  packetsLost: number
  deviceId: string
}

export type IReceiverData = {
  totalRate: number
  rtt: number
  tracks: ITrackStat[]
}

export type IMonitor = {
  sender: ISenderData,
  received: IReceiverData
}

export interface IMonitorInitOptions {
  stats? (data: IMonitor): void
}

const trans2ITrackStat = (iceCandidatePair: IRCCandidatePairStat | undefined, item: IRCTrackStat): ITrackStat => {
  return {
    mediaType: item.kind,
    googTrackId: item.trackId,
    googCodecName: '',
    audioLevel: item.audioLevel?.toString() || '',
    samplingRate: '',
    frameRate: item.frameRate?.toString() || '',
    packLostReceivedRate: item.packetsLostRate.toString(),
    trackReceived: item.bitrate.toString(),
    resolution: item.frameWidth && item.frameHeight ? [item.frameWidth, item.frameHeight].join('x') : '',
    googFirsReceived: '',
    googRenderDelayMs: '',
    googJitterReceived: item.jitter.toString(),
    googNacksReceived: '',
    googPlisReceived: '',
    googRtt: iceCandidatePair?.rtt.toString() || '',
    codecImplementationName: '',
    trackState: '',
    streamId: item.trackId.replace(/_[01](_tiny)?$/, '')
  }
}

const parseRTCStateReport = (resport: IRCRTCStateReport): IMonitor => {
  const { receivers, senders, iceCandidatePair, timestamp } = resport
  const trans = (item: IRCTrackStat): ITrackStat => {
    return trans2ITrackStat(iceCandidatePair, item)
  }
  const sender: ISenderData = {
    deviceId: '',
    sendBand: iceCandidatePair?.availableOutgoingBitrate || 0,
    receiveBand: iceCandidatePair?.availableIncomingBitrate || 0,
    totalRate: iceCandidatePair?.bitrateSend || 0,
    tracks: senders.map(trans),
    networkType: iceCandidatePair?.networkType || 'unknown',
    rtt: iceCandidatePair?.rtt || 0,
    localAddress: iceCandidatePair?.IP || '',
    packetsLost: NaN
  }
  const received: IReceiverData = {
    totalRate: iceCandidatePair?.bitrateRecv || 0,
    rtt: iceCandidatePair?.rtt || 0,
    tracks: receivers.map(trans)
  }
  return { sender, received }
}

export class Monitor extends BasicModule {
  private readonly _options: IMonitorInitOptions
  constructor (options: IMonitorInitOptions) {
    super()
    this._options = { ...options }
    this._ctrl.onMonitorListener = (report: IRCRTCStateReport) => {
      this._options.stats?.(parseRTCStateReport(report))
    }
  }
}
