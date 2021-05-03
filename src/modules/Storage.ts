import { KVString } from '@rongcloud/engine'
import { RCRTCCode } from '@rongcloud/plugin-rtc'
import logger from '../logger'
import { BasicModule } from './Basic'

export type IStorageMessage = {
  name: string
  content: string
}

export class Storage extends BasicModule {
  set (key: string, value: string, msg?: IStorageMessage) {
    logger.debug(`Storage.set -> key: ${key}, value: ${value}, msg: ${JSON.stringify(msg)}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.setRoomAttribute(key, value, msg)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`Storage.set succeed -> key: ${key}, value: ${value}, msg: ${JSON.stringify(msg)}`)
        return Promise.resolve()
      }
      logger.error(`Storage.set failed -> code: ${code}, key: ${key}, value: ${value}`)
      return Promise.reject({ code })
    })
  }

  get (keys: string | string[]): Promise<KVString> {
    const attrs = typeof keys === 'string' ? [keys] : keys
    logger.debug(`Storage.get -> keys: ${attrs}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { data, code } = await room.getRoomAttributes(attrs)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`Storage.get succeed -> keys: ${attrs}`)
        return data!
      }
      logger.error(`Storage.get failed -> keys: ${attrs}`)
      return Promise.reject({ code })
    })
  }

  remove (key: string, msg: IStorageMessage): Promise<void> {
    logger.debug(`Storage.remove -> key: ${key}, msg: ${JSON.stringify(msg)}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.deleteRoomAttributes([key], msg)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`Storage.remove succeed -> key: ${key}`)
        return
      }
      logger.error(`Storage.remove failed -> code: ${code}, key: ${key}`)
      return Promise.reject({ code })
    })
  }
}
