import { KVString } from '@rongcloud/engine'
import { RCRTCCode } from '@rongcloud/plugin-rtc'
import logger from '../logger'
import { BasicModule } from './Basic'

export type IStorageMessage = {
  name: string
  content: string
}

export class Storage extends BasicModule {
  private _set (key: string, value: string, msg?: IStorageMessage, isInner: boolean = false, funcName: string = 'Storage.set'): Promise<void> {
    logger.debug(`${JSON.stringify(funcName)} -> key: ${key}, value: ${value}, msg: ${JSON.stringify(msg)}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.setRoomAttribute(key, value, msg, isInner)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`${JSON.stringify(funcName)} succeed -> key: ${key}, value: ${value}, msg: ${JSON.stringify(msg)}`)
        return Promise.resolve()
      }
      logger.error(`${JSON.stringify(funcName)} failed -> code: ${code}, key: ${key}, value: ${value}`)
      return Promise.reject({ code })
    })
  }

  private _get (keys: string | string[], isInner: boolean = false, funcName: string = 'Storage.get') {
    const attrs = typeof keys === 'string' ? [keys] : keys
    logger.debug(`${JSON.stringify(funcName)} -> keys: ${attrs}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { data, code } = await room.getRoomAttributes(attrs, isInner)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`${JSON.stringify(funcName)} succeed -> keys: ${attrs}`)
        return data!
      }
      logger.error(`${JSON.stringify(funcName)} failed -> keys: ${attrs}`)
      return Promise.reject({ code })
    })
  }

  private _remove (key: string, msg: IStorageMessage, isInner: boolean = false, funcName: string = 'Storage.remove') {
    logger.debug(`${JSON.stringify(funcName)} -> key: ${key}, msg: ${JSON.stringify(msg)}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.deleteRoomAttributes([key], msg)
      if (code === RCRTCCode.SUCCESS) {
        logger.info(`${JSON.stringify(funcName)} succeed -> key: ${key}`)
        return
      }
      logger.error(`${JSON.stringify(funcName)} failed -> code: ${code}, key: ${key}`)
      return Promise.reject({ code })
    })
  }

  set (key: string, value: string, msg?: IStorageMessage) {
    return this._set(key, value, msg)
  }

  get (keys: string | string[]): Promise<KVString> {
    return this._get(keys)
  }

  remove (key: string, msg: IStorageMessage): Promise<void> {
    return this._remove(key, msg)
  }

  __innerSet (key: string, value: string, msg?: IStorageMessage): Promise<void> {
    return this._set(key, value, msg, true, 'Storage.__innerSet')
  }

  __innerGet (keys: string | string[]): Promise<KVString> {
    return this._get(keys, true, 'Stroage.__innerGet')
  }

  __innerRemove (key: string, msg: IStorageMessage): Promise<void> {
    return this._remove(key, msg, true, 'Stroage.__innerRemove')
  }
}
