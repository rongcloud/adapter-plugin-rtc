import { RCRTCClient } from '@rongcloud/plugin-rtc'
import { LiveType, Mode, ROLE } from '../enums'

export interface IRTCAdapterOptions {
  client: RCRTCClient
  bitrate?: { min: number, max: number }
  debug?: boolean
  logger?: (msg: string) => void
  liveRole?: ROLE
  mode?: Mode
  liveType?: LiveType
}
