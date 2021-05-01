import { BasicModule } from './Basic'

export interface IReportInitOptions {
  spoke (user: { id: string, stream: { audioLevel: number } }): void
}

export class Report extends BasicModule {
  private readonly _options: IReportInitOptions
  constructor (options: IReportInitOptions) {
    super()
    this._options = { ...options }
  }
}
