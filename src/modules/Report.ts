import { BasicModule } from './Basic'

export interface IReportInitOptions {
  spoke? (user: { id: string, stream: { audioLevel: number } }): void
}

export interface IReportStartOptions {
  frequency: number
}

export class Report extends BasicModule {
  private readonly _options: IReportInitOptions
  constructor (options: IReportInitOptions) {
    super()
    this._options = { ...options }
  }

  start (options?: IReportStartOptions) {
    this._options.spoke && this._ctrl.checkRoomThen(async room => {
      room.onAudioLevelChange((audioLevelReportList) => {
        audioLevelReportList.forEach(item => {
          const data = {
            id: item.track.getUserId(),
            stream: {
              audioLevel: item.audioLevel
            }
          }
          this._options.spoke?.(data)
        })
      }, options?.frequency)
    })
  }
}
