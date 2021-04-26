import { RCRTCClient } from '@rongcloud/plugin-rtc'

import logger from './logger'

export interface IRTCLibOption {
}

export class RTCLib {
  constructor (private _initOption: IRTCLibOption) {
    logger.warn(`${__NAME__} Version: ${__VERSION__}, CommitId: ${__COMMIT_ID__}`)
  }
}
