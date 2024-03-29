import { RCLivingType, MixLayoutMode as LayoutMode, MixVideoRenderMode as RenderMode } from '@rongcloud/plugin-rtc'

export { LayoutMode, RenderMode }

export enum LiveType {
  AUDIO_AND_VIDEO = RCLivingType.VIDEO,
  AUDIO = RCLivingType.AUDIO
}

export enum Mode {
  RTC = 0, LIVE = 2
}

export enum ROLE {
  ANCHOR = 1, AUDIENCE = 2
}

export enum Resolution {
  '176_132' = 'RESOLUTION_176_132',
  '240_240' = 'RESOLUTION_240_240',
  '256_144' = 'RESOLUTION_256_144',
  '320_180' = 'RESOLUTION_320_180',
  '320_240' = 'RESOLUTION_320_240',
  '480_360' = 'RESOLUTION_480_360',
  '480_480' = 'RESOLUTION_480_480',
  '640_360' = 'RESOLUTION_640_360',
  '640_480' = 'RESOLUTION_640_480',
  '720_480' = 'RESOLUTION_720_480',
  '1280_720' ='RESOLUTION_1280_720',
  '1920_1080' = 'RESOLUTION_1920_1080'
}

export const RongRTCVideoFps = {
  10: 10, 15: 15, 24: 24, 30: 30
}

export enum StorageType {
  ROOM = 1, USER =2
}

export enum StreamSize {
  MAX = 1, MIN = 2
}

export enum StreamType {
  NODE = -1, AUDIO = 0, VIDEO = 1, AUDIO_AND_VIDEO = 2
}

/**
 * 从 53900 开始，避免与 v5 中的 RCRTCCode 冲突
 */
export enum RCAdapterCode {
  ANDIENCE_CANNOT_JOIN_ROOM = 53901,
  GET_SCREEN_STREAM_FAILED = 53902,
  NOT_AUCHOR = 53903
}
