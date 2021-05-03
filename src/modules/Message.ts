import { RCRTCCode } from '@rongcloud/plugin-rtc'
import logger from '../logger'
import { BasicModule } from './Basic'

export interface IMessageInfo {
  name: string
  content: unknown,
  senderId: string,
  uId: string
}

export class Message extends BasicModule {
  constructor (private _options: { received: (msg: IMessageInfo) => void }) {
    super()
    this._ctrl.on('message', this._onMessage, this)
  }

  private _onMessage (message: IMessageInfo) {
    this._options.received(message)
  }

  send (msg: { name: string, content: unknown }) {
    logger.debug(`Message.send -> ${JSON.stringify(msg)}`)
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.sendMessage(msg.name, msg.content)
      if (code === RCRTCCode.SUCCESS) {
        return Promise.resolve()
      }
      return Promise.reject({ code })
    })
  }
}
