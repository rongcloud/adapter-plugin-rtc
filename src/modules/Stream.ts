import { RCLivingType, RCFrameRate, RCRTCCode, RCMediaType, RCRemoteTrack, RCLocalTrack, RCTrack, RCResolution, RCRTCRoom } from '@rongcloud/plugin-rtc'
import { StreamSize, StreamType, Resolution, Mode, ROLE, LayoutMode, RenderMode } from '../enums'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IResInfo {
  tag: string,
  type: StreamType
}

export interface IStreamInfo extends IResInfo {
  mediaStream: MediaStream
}

export interface IOutputInfo extends IResInfo {
  enable: { audio: boolean, video: boolean },
  mediaStream?: MediaStream
}

export interface IPublishOptions extends IStreamInfo {
  size?: StreamSize
}

export type IUserRes<T> = { id: string, stream: T }

export interface IStreamInitOptions {
  published (user: IUserRes<IOutputInfo>): void
  unpublished (user: IUserRes<IOutputInfo>): void
  disabled (user: IUserRes<IOutputInfo>): void
  enabled (user: IUserRes<IOutputInfo>): void
  muted (user: IUserRes<IOutputInfo>): void
  unmuted (user: IUserRes<IOutputInfo>): void
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

const getEnable = (tracks: RCTrack[]): { audio: boolean, video: boolean } => {
  const enable = { audio: false, video: false }
  tracks.forEach(item => {
    const enabled = !(item.isLocalMuted() || item.isOwnerMuted())
    enable[item.isAudioTrack() ? 'audio' : 'video'] = enabled
  })
  return enable
}

const tranToV5Resolution = (resolution: Resolution): RCResolution => {
  const arr = resolution.split('_')
  const width = arr[1]
  const height = arr[2]
  return `W${width}_H${height}` as RCResolution
}

const getEnableByTrack = (track: RCRemoteTrack, room: RCRTCRoom) => {
  const msid = track.getStreamId()
  const audioTrack = track.isAudioTrack() ? track : room.getRemoteTrack(msid + '_0')
  const videoTrack = track.isVideoTrack() ? track : room.getRemoteTrack(msid + '_1')

  return {
    audio: !!(audioTrack && !(audioTrack.isLocalMuted() || audioTrack.isOwnerMuted())),
    video: !!(videoTrack && !(videoTrack.isLocalMuted() || videoTrack.isOwnerMuted()))
  }
}

export class Stream extends BasicModule {
  private readonly _options: IStreamInitOptions

  public readonly video: IVideoNode
  public readonly audio: IAudioNode

  // private readonly _promiseMaps: { [msid: string]: {
  //   resolve: (data: IUserRes<IOutputInfo>) => void,
  //   reject: (reason?: any) => void,
  //   options: IUserRes<IResInfo>,
  // }} = {}

  private static readonly _streamMaps: { [msid: string]: MediaStream } = {}

  constructor (options: IStreamInitOptions) {
    super()
    this._options = { ...options }

    const _this = this

    const changeTrackState = async (type: StreamType, enable: boolean, options: IUserRes<{ tag: string }>) => {
      logger.info(`changeTrackState -> type: ${type}, enable: ${enable}, options: ${JSON.stringify({
        id: options.id, stream: { tag: options.stream.tag }
      })}`)
      const userId = this._ctrl.getRTCClient().getCurrentId()
      const trackId = parseTrackIds(type, options.id, options.stream.tag)[0]
      return this._ctrl.checkRoomThen(async room => {
        const track = userId === options.id ? room.getLocalTrack(trackId) : room.getRemoteTrack(trackId)
        if (track) enable ? track.unmute() : track.mute()
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

    this._ctrl.onTrackPublish = (tracks) => {
      logger.info(`onTrackPublish -> ${tracks.map(item => item.getTrackId())}`)

      const published = this._options.published
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
        published({ id, stream: { tag, type, enable: getEnable(arr) } })
      }
    }
    this._ctrl.onTrackUnpublish = (tracks) => {
      logger.info(`onTrackUnpublish -> ${tracks.map(item => item.getTrackId())}`)

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
        unpublished({ id, stream: { tag, type, enable: getEnable(arr) } })
      }
    }

    this._ctrl.onTrackReady = (track) => {
      const msid = track.getStreamId()
      const mediaStream = Stream._streamMaps[msid] = Stream._streamMaps[msid] || new MediaStream()

      // 清理原轨道同类型数据，填充新 MediaStreamTrack 实例
      const msTracks = track.isAudioTrack() ? mediaStream.getAudioTracks() : mediaStream.getVideoTracks()
      msTracks.length && msTracks.forEach(item => mediaStream.removeTrack(item))
      const msTrack = track.__innerGetMediaStreamTrack()!
      logger.debug(`onTrackReady -> msid: ${msid}, kind: ${msTrack.kind}, muted: ${msTrack.muted}, enabled: ${msTrack.enabled}, id: ${msTrack.id}, readyState: ${msTrack.readyState}`)
      mediaStream.addTrack(msTrack)
    }

    const onMediaMuteChange = (type: StreamType, track: RCRemoteTrack, room: RCRTCRoom, handle: (user: IUserRes<IOutputInfo>) => void) => {
      if (!handle) {
        return
      }
      const enable = getEnableByTrack(track, room)
      handle({
        id: track.getUserId(),
        stream: {
          tag: track.getTag(),
          type,
          mediaStream: Stream._streamMaps[track.getStreamId()],
          enable
        }
      })
    }

    this._ctrl.onAudioMuteChange = (track, room) => {
      const enable = !track.isOwnerMuted()
      onMediaMuteChange(StreamType.AUDIO, track, room, enable ? _this._options.unmuted : _this._options.muted)
    }

    this._ctrl.onVideoMuteChange = (track, room) => {
      const enable = !track.isOwnerMuted()
      onMediaMuteChange(StreamType.VIDEO, track, room, enable ? _this._options.enabled : _this._options.disabled)
    }

    this._ctrl.on('onLeaveRoom', this._onLeaveRoom, this)
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
    logger.info(`publish -> ${JSON.stringify({ stream: { tag: options.stream.tag, type: options.stream.type } })}`)

    const { tag, type, mediaStream } = options.stream
    const withoutAudio = type === StreamType.VIDEO
    const withoutVideo = type === StreamType.AUDIO

    const { code, tracks } = await this._ctrl.getRTCClient().createLocalTracks(tag, mediaStream, { withoutAudio, withoutVideo })
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }

    const msid = tracks[0].getStreamId()
    Stream._streamMaps[msid] = mediaStream

    return this._ctrl.checkRoomThen(async (room) => {
      const { code, liveUrl } = await room.publish(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
      return { liveUrl }
    })
  }

  unpublish (options: { stream: IResInfo }) {
    logger.info(`unpublish -> ${JSON.stringify({ stream: { tag: options.stream.tag, type: options.stream.type } })}`)

    const { tag, type } = options.stream
    const userId = this._ctrl.getRTCClient().getCurrentId()
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks: RCLocalTrack[] = trackIds.map(id => room.getLocalTrack(id)!).filter(item => !!item)
      const { code } = await room.unpublish(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  private async _subLiveAsAudience (options: ISubLiveOptions): Promise<{ mediaStream: MediaStream }> {
    const audience = this._ctrl.getRTCClient().getAudienceClient()
    const livingType: RCLivingType = options.type === StreamType.AUDIO ? RCLivingType.AUDIO : RCLivingType.VIDEO
    const mediaType: RCMediaType = options.type === StreamType.AUDIO ? RCMediaType.AUDIO_ONLY : RCMediaType.AUDIO_VIDEO
    const { code, tracks } = await audience.subscribe(options.liveUrl, livingType, mediaType, options.size === StreamSize.MIN)

    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }

    const track = tracks[0]
    const msid = track.getStreamId()

    // 无流等待
    if (tracks.some(item => !item.__innerGetMediaStreamTrack())) {
      await new Promise<void>((resolve) => {
        audience.registerTrackEventListener({
          onTrackReady () {
            if (tracks.every(item => item.__innerGetMediaStreamTrack())) {
              resolve()
            }
          }
        })
      })
    }

    const mediaStream = Stream._streamMaps[msid] = Stream._streamMaps[msid] || new MediaStream()
    mediaStream.getTracks().forEach(item => mediaStream.removeTrack(item))
    tracks.forEach(track => {
      const msTrack = track.__innerGetMediaStreamTrack()!
      mediaStream.addTrack(msTrack)
    })

    return { mediaStream }
  }

  private async _unsubLiveAsAudience (): Promise<void> {
    const audience = this._ctrl.getRTCClient().getAudienceClient()
    const { code } = await audience.unsubscribe()
    if (code !== RCRTCCode.SUCCESS) {
      return Promise.reject({ code })
    }
  }

  private _subscribe (options: IUserRes<IResInfo>): Promise<IUserRes<IOutputInfo>> {
    const { id: userId, stream } = options as IUserRes<IResInfo>
    const { tag, type } = stream
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks = trackIds.map(id => room.getRemoteTrack(id)!)

      // 订阅列表为空或存在非法资源
      if (trackIds.length === 0 || tracks.some(item => !item)) {
        logger.error(`subscribe failed. wrong params -> options: ${JSON.stringify({
          id: userId, stream: { tag, type }
        })}`)
        return Promise.reject({ code: RCRTCCode.PARAMS_ERROR })
      }

      // 此处不可检测内存态状态，因业务层可能并行调用 unsub 和 sub 且多次调用，SDK 内部是队列事务处理，
      // 会导致事务当前检测用的内存态数据在业务真实执行时过期

      // 其他需要走订阅流程的资源，等待 rtlib 的 onTrackReady 通知时处理差异
      return new Promise<IUserRes<IOutputInfo>>((resolve, reject) => {
        room.subscribe(tracks).then(({ code }) => {
          if (code !== RCRTCCode.SUCCESS) {
            logger.warn(`subscribe failed. -> code: ${code}, options: ${JSON.stringify({
              id: userId, stream: { tag, type }
            })}`)
            reject({ code })
          } else {
            logger.info(`subscribe success. -> options: ${JSON.stringify({
              id: userId, stream: { tag, type }
            })}`)
            const msid = [userId, tag].join('_')
            // 为避免重复订阅时，收不到 onTrackReady 回调
            setTimeout(() => {
              const mediaStream = Stream._streamMaps[msid]
              resolve({
                id: userId,
                stream: {
                  tag,
                  type,
                  mediaStream,
                  enable: getEnableByTrack(tracks[0], room)
                }
              })
            })
          }
        })
      })
    })
  }

  subscribe (options: IUserRes<IResInfo> | ISubLiveOptions): Promise<IUserRes<IOutputInfo>|{ mediaStream: MediaStream }> {
    const mode = this._ctrl.getRTCMode()
    const role = this._ctrl.getLiveRole()
    if (mode === Mode.LIVE && role === ROLE.AUDIENCE) {
      const attrs: ISubLiveOptions = options as ISubLiveOptions
      logger.info(`subscribe -> ${JSON.stringify({ liveUrl: attrs.liveUrl, type: attrs.type, size: attrs.size })}`)
      return this._subLiveAsAudience(attrs)
    }
    const attrs: IUserRes<IResInfo> = options as IUserRes<IResInfo>
    logger.info(`subscribe -> ${JSON.stringify({ id: attrs.id, stream: { tag: attrs.stream.tag, type: attrs.stream.type } })}`)
    return this._subscribe(attrs)
  }

  private _unsubscribe (options: IUserRes<IResInfo>) {
    const { id: userId, stream } = options
    const { tag, type } = stream
    const trackIds = parseTrackIds(type, userId, tag)

    return this._ctrl.checkRoomThen(async room => {
      const tracks = trackIds.map(id => room.getRemoteTrack(id)!).filter(item => !!item)
      if (tracks.length === 0) return
      const { code } = await room.unsubscribe(tracks)
      if (code !== RCRTCCode.SUCCESS) {
        logger.warn(`unsubscribe failed -> code: ${code}, options: ${JSON.stringify({ id: options!.id, stream: { tag: options!.stream.tag, type: options!.stream.type } })}`)
        return Promise.reject({ code })
      }
      logger.info(`unsubscribe success -> ${JSON.stringify({ id: options!.id, stream: { tag: options!.stream.tag, type: options!.stream.type } })}`)
    })
  }

  unsubscribe (options?: IUserRes<IResInfo>) {
    const mode = this._ctrl.getRTCMode()
    const role = this._ctrl.getLiveRole()

    if (mode === Mode.LIVE && role === ROLE.AUDIENCE) {
      logger.info('unsubscribe liveurl.')
      return this._unsubLiveAsAudience()
    }

    logger.info(`unsubscribe -> ${JSON.stringify({ id: options!.id, stream: { tag: options!.stream.tag, type: options!.stream.type } })}`)
    return this._unsubscribe(options!)
  }

  resize (options: IUserRes<{ tag: string, size: StreamSize }>) {
    logger.info(`resize -> ${JSON.stringify({ id: options.id, stream: { tag: options.stream.tag, size: options.stream.size } })}`)
    const { id, stream } = options
    const { tag, size } = stream
    const trackIds = parseTrackIds(StreamType.VIDEO, id, tag)

    return this._ctrl.checkRoomThen(async room => {
      const track = trackIds.map(id => room.getRemoteTrack(id)!).filter(item => !!item)[0]
      const { code } = await room.subscribe([{ subTiny: size === StreamSize.MIN, track }])
      if (code !== RCRTCCode.SUCCESS) {
        return Promise.reject({ code })
      }
    })
  }

  setMixConfig (options: IMCUConfigInfo): Promise<void> {
    logger.info(`setMixConfig -> ${JSON.stringify(options)}`)
    return this._ctrl.checkAuchorThen(async room => {
      const builder = room.getMCUConfigBuilder()
      builder.setMixLayoutMode(options.layoutMode)
      options.hostStreamId && builder.setHostVideoTrack(options.hostStreamId + '_1')
      if (options.video) {
        const { renderMode, width, height, fps, bitrate } = options.video
        renderMode && builder.setOutputVideoRenderMode(renderMode)
        bitrate && builder.setOutputVideoBitrate(bitrate)
        // 输出宽高及帧率配置
        let key = `${width}_${height}`
        if (key in Resolution) {
          const resolution = tranToV5Resolution((Resolution as any)[key])
          builder.setOutputVideoResolution(resolution)
        }
        key = `FPS_${fps}`
        if (key in RCFrameRate) {
          builder.setOutputVideoFPS(key as RCFrameRate)
        }
      }
      if (options.tinyVideo) {
        const { width, height, fps, bitrate } = options.tinyVideo
        // 输出宽高及帧率配置
        let key = `${width}_${height}`
        if (key in Resolution) {
          const resolution = tranToV5Resolution((Resolution as any)[key])
          builder.setOutputTinyVideoResolution(resolution)
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

  private _onLeaveRoom () {
    Object.keys(Stream._streamMaps).forEach(key => {
      const stream = Stream._streamMaps[key]
      stream.getTracks().forEach(track => {
        track.stop()
        stream.removeTrack(track)
      })
      delete Stream._streamMaps[key]
    })
  }

  protected onDestroy () {
    this._onLeaveRoom()
    Object.keys(Stream._streamMaps).forEach(key => {
      const stream = Stream._streamMaps[key]
      stream.getTracks().forEach(track => {
        track.stop()
        stream.removeTrack(track)
      })
      delete Stream._streamMaps[key]
    })
  }
}
