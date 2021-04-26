import { LogLevel } from '@rongcloud/engine'

import { IRTCAdapterOptions } from './interfaces/IRTCAdapterOptions'
import logger from './logger'
import { Room } from './modules/Room'
import { Stream } from './modules/Stream'
import { RTCClientCtrl } from './RTCClientM'

export * from './enums'

// 导出模块
export {
  Room,
  Stream
}

export function init (options: IRTCAdapterOptions) {
  if (!options || !options.client) {
    logger.error(`${__NAME__} init failed -> \`client\` is invalid.`)
    return
  }

  if (RTCClientCtrl.getInstance()) {
    logger.error(`${__NAME__} initialized!`)
    return
  }

  const { debug, logger: log } = options
  debug && logger.setLogLevel(LogLevel.DEBUG)
  log && logger.setLogStdout((_, content) => log(content))

  logger.warn(`${__NAME__} Version: ${__VERSION__}, CommitId: ${__COMMIT_ID__}`)
  RTCClientCtrl.init(options)
}

export function destroy () {
  if (!RTCClientCtrl.getInstance()) {
    logger.warn(`${__NAME__} has been destroyed.`)
    return
  }
  RTCClientCtrl.destroy()
}
