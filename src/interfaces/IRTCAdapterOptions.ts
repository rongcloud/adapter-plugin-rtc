import { RCRTCClient } from '@rongcloud/plugin-rtc'
import { Mode, ROLE, LiveType } from '../enums'

export interface IRTCAdapterOptions {
  client: RCRTCClient
  bitrate?: { min: number, max: number }
  debug?: boolean
  logger?: (msg: string) => void
  liveRole?: ROLE
  mode?: Mode
  liveType?: LiveType
}
