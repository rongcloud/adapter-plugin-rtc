import { StreamSize, StreamType } from '../enums'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IResInfo { tag: string, type: StreamType }
export interface IStreamInfo extends IResInfo {
  mediaStream: MediaStream,
}

export interface IPublishOptions extends IStreamInfo {
  size?: StreamSize
}

export type IUserRes<T> = { id: string, stream: T }

export interface IStreamInitOptions {
  published (user: IUserRes<IPublishOptions>): void
  unpublished (user: IUserRes<IResInfo>): void
  disabled (): void
  enabled (): void
  muted (): void
  unmuted (): void
}

export interface IStreamCaptureOptions {
  width: number
  height: number
  frameRate: number
  screen: boolean
  desktopStreamId: string
  audio: boolean | { deviceId: { exact: string }}
  video: boolean | { deviceId: { exact: string }}
}

export class Stream extends BasicModule {
  public readonly video!: {
    disable (options: IUserRes<{ tag: string }>): void
    enable (options: IUserRes<{ tag: string }>): void
  }

  public readonly audio!: {
    mute (options: IUserRes<{ tag: string }>): void
    unmute (options: IUserRes<{ tag: string }>): void
  }

  private readonly _options: IStreamInitOptions

  constructor (options: IStreamInitOptions) {
    super()
    this._options = { ...options }
  }

  get (options: IStreamCaptureOptions) {
    logger.error('todo ->')
  }

  publish (options: { stream: IStreamInfo }) {
    logger.error('todo ->')
  }

  unpublish (options: { stream: IResInfo }) {
    logger.error('todo ->')
  }

  subscribe (options: IUserRes<IResInfo>) {
    logger.error('todo ->')
  }

  unsubscribe (options: IUserRes<IResInfo>) {
    logger.error('todo ->')
  }

  resize (options: IUserRes<{ tag: string, size: StreamSize }>) {
    logger.error('todo ->')
  }

  setMixConfig () {
    logger.error('todo ->')
  }

  addPublishStreamUrl (url: string) {
    logger.error('todo ->')
  }

  removePublishStreamUrl (url: string) {
    logger.error('todo ->')
  }
}
