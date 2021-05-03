import { RCRTCCode } from '@rongcloud/plugin-rtc'
import { BasicModule } from './Basic'

export interface IMessageInfo {
  name: string
  content: unknown,
  senderId: string,
  uId: string
}

export class Message extends BasicModule {
  constructor (options: { received: (msg: IMessageInfo) => void }) {
    super()
    this._ctrl.registerRoomEventListener({
      onMessageReceive (name, content, senderId, messageUId) {
        options.received({ name, content, senderId, uId: messageUId })
      }
    })
  }

  send (msg: { name: string, content: unknown }) {
    return this._ctrl.checkRoomThen(async (room) => {
      const { code } = await room.sendMessage(msg.name, msg.content)
      if (code === RCRTCCode.SUCCESS) {
        return Promise.resolve()
      }
      return Promise.reject({ code })
    })
  }
}
