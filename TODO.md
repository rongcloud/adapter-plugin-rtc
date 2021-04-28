### TODO

##### RongRTCAdapter（index.ts）

* ✅ StreamType
* ✅ StreamSize
* ✅ Mode
* ✅ ROLE
* ✅ LiveType
* ✅ LayoutMode
* ✅ RenderMode
* ✅ Resolution
* ✅ RongRTCVideoFps
* ✅ StorageType
---
* ✅ Room
* ✅ Stream
* ✅ Message
* ✅ Device
* ✅ Storage
* ✅ Monitor
---
* ⭕️ init()
* ⭕️ destroy()
* ⭕️ becameAuchor()

##### Room

* ⭕️ constructor()
* ⭕️ join()
* ⭕️ leave()
* ⭕️ get()

##### Stream

* ⭕️ constructor()
* ⭕️ get()
* ⭕️ publish()
* ⭕️ unpublish()
* ⭕️ subscribe()
* ⭕️ unsubscribe()
* ⭕️ video.disable()
* ⭕️ video.enable()
* ⭕️ audio.mute()
* ⭕️ audio.ummute()
* ⭕️ resize()
---
* ⭕️ addPublishStreamUrl()
* ⭕️ removePublishStreamUrl()
* ⭕️ setMixConfig()

RTCLib v3 版本中，设置推流地址需要调用 `setMixConfig` 才可生效，桥阶层保持该逻辑不变

#### Device

* ⭕️ constructor()
* ⭕️ get()

#### Monitor

* ⭕️ constructor()

#### Message

* ⭕️ constructor()
* ⭕️ send()

#### Storage

* ⭕️ constructor()
* ⭕️ set()
* ⭕️ get()
* ⭕️ remove()
