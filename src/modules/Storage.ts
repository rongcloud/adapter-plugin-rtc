import logger from '../logger'
import { BasicModule } from './Basic'

export type IStorageMessage = {
  name: string
  content: string
}

export class Storage extends BasicModule {
  set (key: string, value: string, msg?: IStorageMessage) {
    logger.error('todo ->')
  }

  get (keys: string | string[]) {
    logger.error('todo ->')
  }

  remove (key: string, msg: IStorageMessage) {
    logger.error('todo ->')
  }
}
