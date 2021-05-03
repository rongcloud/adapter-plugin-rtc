import logger from '../logger'

export class Device {
  get () {
    return navigator.mediaDevices.enumerateDevices()
  }
}
