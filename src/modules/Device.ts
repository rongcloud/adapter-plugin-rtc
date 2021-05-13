export class Device {
  get () {
    return navigator.mediaDevices.enumerateDevices()
  }
}
