# @rongcloud/adapter-plugin-rtc

为融云 RTCLib v3 用户提供的桥接方案，以便于用户最小化改动的情况下可以直接升级至 RTCLib v5 - `@rongcloud/plugin-rtc`

## 依赖安装

* 使用 RongIMLib v2 的开发者需升级至 RongIMLib v2.8 以上 - `npm i @rongcloud/imlib-v2@latest`
* 使用 RongIMLib v3 及 v4 的开发者需升级至 RongIMLib v4.3 以上 - `npm i @rongcloud/imlib-v4@latest`
* 需安装 RTCLib v5 版本 - `npm i @rongcloud/plugin-rtc@latest`

## 安装桥接模块

```shell
npm i @rongcloud/adapter-plugin-rtc
```

## CHANGE

以下列出的是相较于老版本 RongRTC-v3，使用桥阶模块所需要进行的修改内容

##### init

```typescript
import RongIMLib from '@rongcloud/imlib-v2'
import { installer, RCRTCClient, IRCRTCClientOption } from '@rongcloud/plugin-rtc'
import RongRTCAdapter, { Mode, LiveType, ROLE } from '@rongcloud/rtc-v3-adapter'

// IM 客户端初始化，此处以 IMLib 2.8 举例
const imClient = RongIMLib.init(appkey, null, { ...options })
// rtc v5 客户端初始化
const rtcClient: RCRTCClient = imClient.install(installer, { ...options })

// 初始化方式变更，不再使用 `new RongRTC()`，同时需要传递 RCRTCClient 实例
RongRTCAdapter.init({ client: rtcClient, bitrate, liveRole?, mode?, liveType? })

// 由于初始化方式变更，故模块获取方式也需要变更，现在直接通过 RongRTCAdapter 顶级变量获取
const { Room, Stream, Message, Device, Storage, StreamType, StreamSize } = RongRTCAdapter;

// 反初始化，相当于原 `rongRTC.destroy()`
// 为避免内存泄露，使用该方法后，已初始化的所有功能模块将失效
RongRTCAdapter.uninit()
```

##### Room 模块

```typescript
//Room 模块初始化方式不变
const room = new Room({ id, ...options })
// 加入房间时不再需要传参
room.join(/*{ id: 'userId' }*/).then(() => {}, error => {})
```

##### Stream

```typescript
// Stream 模块初始化方式不变
const stream = new Stream({ ...options })
// 发布及取消发布资源时不再需要传递当前用户 id
stream.publish({ /*id: '',*/ stream: { tag, type, mediaStream }}).then(() => {}, error => {})
stream.unpublish({ /*id: '',*/ stream: { tag, type } }).then(() => {}, error => {})
```

##### Monitor 模块

```typescript
new Monitor({
  stats ({ sender, received }) {
    // 数据内容待验证
  }
});
```
