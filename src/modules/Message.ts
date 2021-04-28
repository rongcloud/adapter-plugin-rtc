import logger from '../logger'
import { BasicModule } from './Basic'

export interface IMessageInfo {
  name: string
  content: unknown,
  senderId: string,
  uId: string
}

export class Message extends BasicModule {
  constructor (private _options: { received: IMessageInfo }) {
    super()
  }

  send (msg: { name: string, content: unknown }) {
    logger.error('todo ->')
  }
}
