import { LogLevel } from '@rongcloud/engine'
import { IRTCAdapterOptions } from './interfaces/IRTCAdapterOptions'
import logger from './logger'
import { Device } from './modules/Device'
import { Message } from './modules/Message'
import { Monitor } from './modules/Monitor'
import { Storage } from './modules/Storage'
import { RTCClientCtrl } from './RTCClientCtrl'

export * from './enums'

export * from './modules/Room'
export * from './modules/Stream'
export * from './modules/Device'
export * from './modules/Message'
export * from './modules/Monitor'
export * from './modules/Storage'

export {
  IRTCAdapterOptions
}

export function init (options: IRTCAdapterOptions) {
  if (!options || !options.client) {
    logger.error(`${__NAME__} init failed -> \`client\` is invalid.`)
    return
  }

  if (RTCClientCtrl.getInstance()) {
    logger.error(`${__NAME__} repeat initialize!`)
    return
  }

  const { debug, logger: log } = options
  debug && logger.setLogLevel(LogLevel.DEBUG)
  log && logger.setLogStdout((_, content) => log(content))

  logger.warn(`${__NAME__} Version: ${__VERSION__}, CommitId: ${__COMMIT_ID__}`)
  RTCClientCtrl.init(options)
}

export function becameAuchor () {
  throw new Error('TODO -> becameAuchor')
}

export function destroy () {
  if (!RTCClientCtrl.getInstance()) {
    logger.warn(`${__NAME__} not initialized yet.`)
    return
  }
  RTCClientCtrl.destroy()
}
