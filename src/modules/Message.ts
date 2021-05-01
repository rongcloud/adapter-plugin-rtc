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
  }
}
