import { RCLivingType, RCFrameRate, RCRTCCode, RCMediaType, RCRemoteTrack } from '@rongcloud/plugin-rtc'
import { StreamSize, StreamType, Resolution, Mode, ROLE, LayoutMode, RenderMode } from '../enums'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IResInfo {
  tag: string,
  type: StreamType
}

export interface IStreamInfo extends IResInfo {
  mediaStream: MediaStream,
}

export interface IPublishOptions extends IStreamInfo {
  size?: StreamSize
}

export type IUserRes<T> = { id: string, stream: T }

export interface IStreamInitOptions {
  published (user: IUserRes<IResInfo>): void
  unpublished (user: IUserRes<IResInfo>): void
  disabled (user: IUserRes<IStreamInfo>): void
  enabled (user: IUserRes<IStreamInfo>): void
  muted (user: IUserRes<IStreamInfo>): void
  unmuted (user: IUserRes<IStreamInfo>): void
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

export interface ISubLiveOptions { liveUrl: string, type: StreamType, size: StreamSize }

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

const parseTrackIds = (type: StreamType, userId: string, tag: string): string[] => {
  const types = type === StreamType.AUDIO_AND_VIDEO ? [StreamType.AUDIO, StreamType.VIDEO] : [type]
  return types.map(item => `${userId}_${tag}_${item}`)
}

export interface IVideoNode {
  disable (options: IUserRes<{ tag: string }>): Promise<void>
  enable (options: IUserRes<{ tag: string }>): Promise<void>
}

export interface IAudioNode {
  mute (options: IUserRes<{ tag: string }>): Promise<void>
  unmute (options: IUserRes<{ tag: string }>): Promise<void>
}

export interface IMCUConfigInfo {
  layoutMode: LayoutMode,
  video?: {
    renderMode?: RenderMode,
    width?: number,
    height?: number
    fps?: number
    bitrate?: number
  },
  tinyVideo?: {
    width?: number,
    height?: number
    fps?: number
    bitrate?: number
  },
  audio?: {
    bitrate?: number
  },
  /**
   * @deprecated
   */
  hostUserId?: string,
  hostStreamId?: string,
  customLayout?: {
    video?: {
      userId: string,
      streamId: string,
      x: number,
      y: number,
      width: number,
      height: number
    }[]
  }
}

export class Stream extends BasicModule {
  private readonly _options: IStreamInitOptions

  public readonly video: IVideoNode
  public readonly audio: IAudioNode

  private readonly _promiseMaps: { [msid: string]: {
    resolve: (data: IUserRes<IStreamInfo>) => void,
    reject: (reason?: any) => void,
    options: IUserRes<IResInfo>
  }} = {}

  private readonly _streamMaps: { [msid: string]: MediaStream } = {}

  constructor (options: IStreamInitOptions) {
    super()
    this._options = { ...options }

    const _this = this

    const changeTrackState = async (type: StreamType, enable: boolean, options: IUserRes<{ tag: string }>) => {
      const userId = this._ctrl.getRTCClient().getCurrentId()
      const trackId = parseTrackIds(type, options.id, options.stream.tag)[0]
      return this._ctrl.checkRoomThen(async room => {
        const track = userId === options.id ? room.getLocalTrack(trackId) : room.getRemoteTrack(trackId)
        enable ? track.unmute() : track.mute()
      })
    }

    this.video = {
      disable: changeTrackState.bind(_this, StreamType.VIDEO, false),
      enable: changeTrackState.bind(_this, StreamType.VIDEO, true)
    }
    this.audio = {
      mute: changeTrackState.bind(_this, StreamType.AUDIO, false),
      unmute: changeTrackState.bind(_this, StreamType.AUDIO, true)
    }

    this._ctrl.registerRoomEventListener({
      onTrackPublish (tracks) {
        const published = _this._options.published
        if (!published) {
          return
        }

        // 两相同 tag 的 track 需合并为一条通知，与 v3 行为一致
        const maps: { [tag: string]: RCRemoteTrack[] } = {}
        tracks.forEach(track => {
          const tag = track.getTag()
          const arr = maps[tag] = maps[tag] || []
          arr.push(track)
        })

        for (const tag in maps) {
          const arr: RCRemoteTrack[] = maps[tag]
          const track = arr[0]
          const type: StreamType = arr.length === 2
            ? StreamType.AUDIO_AND_VIDEO
            : track.isAudioTrack() ? StreamType.AUDIO : StreamType.VIDEO
          const id = track.getUserId()
          published({ id, stream: { tag, type } })
        }
      },
      onTrackUnpublish (tracks) {
        const unpublished = _this._options.unpublished
        if (!unpublished) {
          return
        }

        // 两相同 tag 的 track 需合并为一条通知，与 v3 行为一致
        const maps: { [tag: string]: RCRemoteTrack[] } = {}
        tracks.forEach(track => {
          const tag = track.getTag()
          const arr = maps[tag] = maps[tag] || []
          arr.push(track)
        })

        for (const tag in maps) {
          const arr: RCRemoteTrack[] = maps[tag]
          const track = arr[0]
          const type: StreamType = arr.length === 2
            ? StreamType.AUDIO_AND_VIDEO
            : track.isAudioTrack() ? StreamType.AUDIO : StreamType.VIDEO
          const id = track.getUserId()
          unpublished({ id, stream: { tag, type } })
        }
      },
      onTrackReady (track) {
        const msid = track.getStreamId()
        const mediaStream = _this._streamMaps[msid] = _this._streamMaps[msid] || new MediaStream()
        mediaStream.addTrack(track.__innerGetMediaStreamTrack()!)
        const data = _this._promiseMaps[msid]
        if (data) {
          const { options, resolve } = data
          delete _this._promiseMaps[msid]
          resolve({ id: options.id, stream: { ...options.stream, mediaStream } })
        }
      },
      onAudioMuteChange (track) {
        const enable = !track.isOwnerMuted()
        const mediaStream = _this._streamMaps[track.getStreamId()]
        const handle = enable ? _this._options.unmuted : _this._options.muted
        if (!handle) {
          return
        }
        handle({ id: track.getUserId(), stream: { tag: track.getTag(), type: StreamType.AUDIO, mediaStream } })
      },
      onVideoMuteChange (track) {
        const enable = !track.isOwnerMuted()
        const mediaStream = _this._streamMaps[track.getStreamId()]
        const handle = enable ? _this._options.enabled : _this._options.disabled
        if (!handle) {
          return
        }
        handle({ id: track.getUserId(), stream: { tag: track.getTag(), type: StreamType.VIDEO, mediaStream } })
      }
    })
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

  async publish (options: { stream: IStreamInfo }): Promise<{ liveUrl?: string }> {
    const { tag, type, mediaStream } = options.stream
    const withoutAudio = type === StreamType.VIDEO
    const withoutVideo = type === StreamType.AUDIO

    const { code, tracks } = await this._ctrl.getRTCClient().createLocalTracks(tag, mediaStream, { withoutAudio, withoutVideo })
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }

    return this._ctrl.checkRoomThen(async (room) => {
      const { code, liveUrl } = await room.publish(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
      return { liveUrl }
    })
  }

  unpublish (options: { stream: IResInfo }) {
    const { tag, type } = options.stream
    const userId = this._ctrl.getRTCClient().getCurrentId()
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks = trackIds.map(id => room.getLocalTrack(id)).filter(item => !!item)
      const { code } = await room.unpublish(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  private async _subLiveAsAudience (options: ISubLiveOptions): Promise<IUserRes<IStreamInfo>> {
    const audience = this._ctrl.getRTCClient().getAudienceClient()
    const livingType: RCLivingType = options.type === StreamType.AUDIO ? RCLivingType.AUDIO : RCLivingType.VIDEO
    const mediaType: RCMediaType = options.type === StreamType.AUDIO ? RCMediaType.AUDIO_ONLY : RCMediaType.AUDIO_VIDEO
    const { code, tracks } = await audience.subscribe(options.liveUrl, livingType, mediaType, options.size === StreamSize.MIN)

    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }

    const track = tracks[0]
    const msid = track.getStreamId()
    const tag = track.getTag()
    const userId = track.getUserId()

    return new Promise((resolve, reject) => {
      this._promiseMaps[msid] = { resolve, reject, options: { id: userId, stream: { tag, type: StreamType.AUDIO_AND_VIDEO } } }
    })
  }

  private async _unsubLiveAsAudience (): Promise<void> {
    const audience = this._ctrl.getRTCClient().getAudienceClient()
    const { code } = await audience.unsubscribe()
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }
  }

  private _subscribe (options: IUserRes<IResInfo>): Promise<IUserRes<IStreamInfo>> {
    const { id: userId, stream } = options as IUserRes<IResInfo>
    const { tag, type } = stream
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks = trackIds.map(id => room.getRemoteTrack(id)).filter(item => !!item)
      const { code } = await room.subscribe(tracks)

      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }

      const msid = tracks[0].getStreamId()
      return new Promise((resolve, reject) => {
        this._promiseMaps[msid] = { resolve, reject, options: { id: userId, stream: { tag, type } } }
      })
    })
  }

  subscribe (options: IUserRes<IResInfo> | ISubLiveOptions): Promise<IUserRes<IStreamInfo>> {
    const mode = this._ctrl.getRTCMode()
    const role = this._ctrl.getLiveRole()
    if (mode === Mode.LIVE && role === ROLE.AUDIENCE) {
      return this._subLiveAsAudience(options as ISubLiveOptions)
    }
    return this._subscribe(options as IUserRes<IResInfo>)
  }

  private _unsubscribe (options: IUserRes<IResInfo>) {
    const { id: userId, stream } = options
    const { tag, type } = stream
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks = trackIds.map(id => room.getRemoteTrack(id)).filter(item => !!item)
      const { code } = await room.unsubscribe(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  unsubscribe (options?: IUserRes<IResInfo>) {
    const mode = this._ctrl.getRTCMode()
    const role = this._ctrl.getLiveRole()
    if (mode === Mode.LIVE && role === ROLE.AUDIENCE) {
      return this._unsubLiveAsAudience()
    }
    return this._unsubscribe(options!)
  }

  resize (options: IUserRes<{ tag: string, size: StreamSize }>) {
    const { id, stream } = options
    const { tag, size } = stream
    const trackIds = parseTrackIds(StreamType.VIDEO, id, tag)

    return this._ctrl.checkRoomThen(async room => {
      const track = trackIds.map(id => room.getRemoteTrack(id)).filter(item => !!item)[0]
      const { code } = await room.subscribe([{ subTiny: size === StreamSize.MIN, track }])
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  setMixConfig (options: IMCUConfigInfo): Promise<void> {
    logger.error('todo -> Stream.setMixConfig')
    return this._ctrl.checkAuchorThen(async room => {
      const builder = room.getMCUConfigBuilder()
      builder.setMixLayoutMode(options.layoutMode)
      options.hostStreamId && builder.setHostVideoTrack(options.hostStreamId + '_1')
      if (options.video) {
        const { renderMode, width, height, fps, bitrate } = options.video
        renderMode && builder.setOutputVideoRenderMode(renderMode)
        bitrate && builder.setOutputVideoBitrate(bitrate)
        // 输出宽高及帧率配置
        let key = `W${width}_H${height}`
        if (key in Resolution) {
          builder.setOutputVideoResolution((Resolution as any)[key])
        }
        key = `FPS_${fps}`
        if (key in RCFrameRate) {
          builder.setOutputVideoFPS(key as RCFrameRate)
        }
      }
      if (options.tinyVideo) {
        const { width, height, fps, bitrate } = options.tinyVideo
        // 输出宽高及帧率配置
        let key = `W${width}_H${height}`
        if (key in Resolution) {
          builder.setOutputTinyVideoResolution((Resolution as any)[key])
        }
        key = `FPS_${fps}`
        if (key in RCFrameRate) {
          builder.setOutputTinyVideoFPS(key as RCFrameRate)
        }
      }
      if (options.audio) {
        const { bitrate } = options.audio
        bitrate && builder.setOutputAudioBitrate(bitrate)
      }
      if (options.customLayout && options.customLayout.video) {
        options.customLayout.video.forEach(item => {
          builder.addCustomizeLayoutVideo(item.streamId + '_1', item.x, item.y, item.width, item.height)
        })
      }
      const { code } = await builder.flush()
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  addPublishStreamUrl (url: string): Promise<void> {
    return this._ctrl.checkAuchorThen(async room => {
      const { code } = await room.getMCUConfigBuilder().addPublishStreamUrls([url]).flush()
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  removePublishStreamUrl (url: string): Promise<void> {
    return this._ctrl.checkAuchorThen(async room => {
      const { code } = await room.getMCUConfigBuilder().removePublishStreamUrls([url]).flush()
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  protected onDestroy () {
    Object.keys(this._streamMaps).forEach(key => {
      const stream = this._streamMaps[key]
      stream.getTracks().forEach(track => {
        track.stop()
        stream.removeTrack(track)
      })
      delete this._streamMaps[key]
    })
  }
}
