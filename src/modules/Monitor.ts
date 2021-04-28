import { BasicModule } from './Basic'

export type ITrackStat = {
  mediaType: string
  googTrackId: string
  googCodecName: string
  audioLevel: string
  samplingRate: string
  trackReceived: string
  packLostReceivedRate: string
  frameRate: string
  resolution: string
  googRenderDelayMs: string
  googJitterReceived: string
  googNacksReceived: string
  googPlisReceived: string
  googRtt: string
  googFirsReceived: string
  codecImplementationName: string
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
  stats (data: IMonitor): void
}

export class Monitor extends BasicModule {
  private readonly _options: IMonitorInitOptions
  constructor (options: IMonitorInitOptions) {
    super()
    this._options = { ...options }
  }
}
