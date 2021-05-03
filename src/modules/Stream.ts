import { RCRTCCode } from '@rongcloud/plugin-rtc'
import { StreamSize, StreamType, Resolution } from '../enums'
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

export interface IGetStreamOptions {
  width?: number
  height?: number
  frameRate?: number
  screen?: boolean
  desktopStreamId?: string
  audio?: boolean | { deviceId: { exact: string }}
  video?: boolean | {
    deviceId: { exact: string },
    resolution?: Resolution
  }
}

const RongRTCVideoBitRate = {
  RESOLUTION_176_132: { width: 176, height: 132, maxBitRate: 150, minBitRate: 80 },
  RESOLUTION_256_144: { width: 256, height: 144, maxBitRate: 240, minBitRate: 120 },
  RESOLUTION_320_180: { width: 320, height: 180, maxBitRate: 280, minBitRate: 120 },
  RESOLUTION_240_240: { width: 240, height: 240, maxBitRate: 280, minBitRate: 120 },
  RESOLUTION_320_240: { width: 320, height: 240, maxBitRate: 400, minBitRate: 120 },
  RESOLUTION_480_360: { width: 480, height: 360, maxBitRate: 650, minBitRate: 150 },
  RESOLUTION_640_360: { width: 640, height: 360, maxBitRate: 800, minBitRate: 180 },
  RESOLUTION_480_480: { width: 480, height: 480, maxBitRate: 800, minBitRate: 180 },
  RESOLUTION_640_480: { width: 640, height: 480, maxBitRate: 900, minBitRate: 200 },
  RESOLUTION_720_480: { width: 720, height: 480, maxBitRate: 1000, minBitRate: 200 },
  RESOLUTION_1280_720: { width: 1280, height: 720, maxBitRate: 2200, minBitRate: 250 },
  RESOLUTION_1920_1080: { width: 1920, height: 1080, maxBitRate: 4000, minBitRate: 400 }
}

const DEFAULT_MS_PROFILE = {
  height: 480,
  width: 640,
  frameRate: 15
}

const getUserMedia = async (constraints?: any) => {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
    return { mediaStream }
  } catch (error) {
    return Promise.reject({ code: RCRTCCode.GET_USER_MEDIA_FAILED })
  }
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

  async get (options: IGetStreamOptions): Promise<{ mediaStream: MediaStream }> {
    if (options?.screen) {
      if (!options.desktopStreamId) {
        return Promise.reject({ code: RCRTCCode.PARAMS_ERROR, msg: 'Failed to get screen shared stream, illegal desktopStreamId' })
      }
      return getUserMedia({
        video: {
          getDisplayMedia: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: options.desktopStreamId
          }
        }
      })
    }

    const constraints: any = options || { audio: true, video: DEFAULT_MS_PROFILE }

    const video = constraints.video
    if (video === false) constraints.video = false
    else if (!video) constraints.video = DEFAULT_MS_PROFILE
    else {
      const resolution: Resolution = video.resolution
      if (resolution && resolution in Resolution) {
        const key: string = (Resolution as any)[resolution]
        const conf = (RongRTCVideoBitRate as any)[(Resolution as any)[resolution]]
        constraints.video = { ...video, ...conf }
      }
    }
    return getUserMedia(constraints)
  }

  publish (options: { stream: IStreamInfo }) {
    logger.error('todo -> Stream.publish')
  }

  unpublish (options: { stream: IResInfo }) {
    logger.error('todo -> Stream.unpublish')
  }

  subscribe (options: IUserRes<IResInfo>) {
    logger.error('todo -> Stream.subscribe')
  }

  unsubscribe (options: IUserRes<IResInfo>) {
    logger.error('todo -> Stream.unsubscribe')
  }

  resize (options: IUserRes<{ tag: string, size: StreamSize }>) {
    logger.error('todo -> Stream.resize')
  }

  setMixConfig () {
    logger.error('todo -> Stream.setMixConfig')
  }

  addPublishStreamUrl (url: string) {
    logger.error('todo -> Stream.addPublishStreamUrl')
  }

  removePublishStreamUrl (url: string) {
    logger.error('todo -> Stream.removePublishStreamUrl')
  }
}
