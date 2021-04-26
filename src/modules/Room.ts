import { BasicModule } from './Basic'

export interface IRoomInitOptions {
  id: string
}

export class Room extends BasicModule {
  private readonly _roomId: string
  constructor (options: IRoomInitOptions) {
    super()

    this._roomId = options.id
  }

  join () {
    this._ctrl?.join(this._roomId)
  }
}
