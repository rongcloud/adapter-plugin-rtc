import { BasicModule } from './Basic'

export interface IReportInitOptions {
  /**
   * 用于接收音量统计数据，当 useBatch 值为 true 时，数据将以数组的形式批量回传
   * @param data
   */
  spoke? (data: { id: string, stream: { audioLevel: number } } | { id: string, stream: { audioLevel: number } }[]): void
  /**
   * 批量接收音量统计信息的开关，默认关闭
   */
  useBatch?: boolean
}

export interface IReportStartOptions {
  /**
   * 音量上报时间间隔，默认 1000ms，有效值 `300` - `1000`
   */
  frequency?: number,
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
        const list = audioLevelReportList.map(item => {
          return {
            id: item.track.getUserId(),
            stream: {
              audioLevel: item.audioLevel
            }
          }
        })
        if (this._options?.useBatch) {
          this._options.spoke?.(list)
        } else {
          list.forEach(item => this._options.spoke?.(item))
        }
      }, options?.frequency)
    })
  }
}
