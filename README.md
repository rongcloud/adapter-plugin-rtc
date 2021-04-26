# @rongcloud/adapter-plugin-rtc

为融云 RTCLib v3 用户提供的桥接方案，以便于用户最小化改动的情况下可以直接升级至 RTCLib v5 - `@rongcloud/plugin-rtc`

### RFC

##### 初始化

```typescript
import RongIMLib from '@rongcloud/imlib-v2'
import { installer, RCRTCClient, IRCRTCClientOption } from '@rongcloud/plugin-rtc'
import RongRTCAdapter, { Mode, LiveType, ROLE } from '@rongcloud/rtc-v3-adapter'

// im 客户端初始化
const imClient = RongIMLib.init()
// rtc v5 客户端初始化
const rtcClient: RCRTCClient = imClient.install(installer, { ...options })
// 初始化 RongRTC，其他不再支持
const rongRTC = new RongRTC({ rtcClient, bitrate, liveRole?, mode?, liveType? })
// 取模块
const { Room, Stream, Message, Device, Storage, StreamType, StreamSize } = rongRTC;
```

##### Room

```typescript
const room = new Room({
  id,
  joined () {},
  left () {},
  kick () {}
})

room.join().then(() => {}, error => {})
room.leave().then(() => {}, error => {})
const { id, total, ...otherKeys } = room.get()
```

##### Stream

```typescript
const stream = new Stream({
  published (user) {
    stream.subscribe(user).then(user => {
      const { id, stream: { tag, mediaStream } } = user
    })
  },
  unpublished (user) {
    stream.unsubscribe(user).then(() => {})
  }
})

// 获取资源
stream.get({
  width: 640,
  height: 480,
  frameRate: 15,
  desktopStreamId: '',
  screen: true,
  audio: { deviceId: { exact: '' }},
  video: { deviceId: { exact: '' }}
}).then(({ mediaStream }) => {}, error => {})

// 发布资源
stream.publish({ id: '', stream: { tag, type, mediaStream }}).then(() => {}, error => {})
stream.unpublish({ id: '', stream: { tag, type } }).then(() => {}, error => {})

// 订阅资源
stream.subscribe({ id: '', stream: { tag, type } }).then(() => {}, error => {})
stream.unsubscribe({ id: '', stream: { tag, type } }).then(() => {}, error => {})

// 禁用启用
stream.video.disable({ id, stream: { tag }})
stream.video.enable({ id, stream: { tag }})
stream.audio.mute({ id, stream: { tag }})
stream.audio.unmute({ id, stream: { tag }})

// 切换大小流
stream.resize({ id, stream: { tag, type, size } })
```

##### Device

```typescript
new Device().get().then((devices) => {})
```

##### Monitor

```typescript
new Monitor({
  stats ({ sender, received }) {
  }
});
```

##### Message

```typescript
// 收
const message = new Message({
  received ({ name, content, senderId, uId }) {}
})

// 发
message.send({ name, content }).then(() => {}, error => {})
```

##### Storage

```typescript
const storage = new Storage()
// 存
storage.set(key, value, message?: { name, content })
// 取
storage.get(key).then((value) => {})
storage.get([key]).then(([value]) => {})
// 删
storage.remove(key, message?: { name, content });
```