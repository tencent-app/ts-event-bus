# @tencent-app/ts-event-bus

一个轻量级的 TypeScript 事件总线库，支持本地和远程事件分发。

## 特性

- 🚀 轻量级，零依赖
- 💪 完整的 TypeScript 类型支持
- 📡 支持本地和远程事件分发
- 🎯 基于主题的发布订阅模式
- 🔄 支持异步事件处理
- 📦 支持 Channel API，提供更清晰的接口

## 安装

```bash
npm install @tencent-app/ts-event-bus
```

## 使用方法

### 基础用法

```typescript
import { EventBus } from '@tencent-app/ts-event-bus';

const bus = new EventBus();

// 订阅事件
const unsubscribe = bus.subscribe('user:login', async (event) => {
  console.log('User logged in:', event);
});

// 分发事件
bus.dispatch('user:login', { userId: '123', username: 'alice' });

// 取消订阅
unsubscribe();
```

### Channel API

Channel API 提供了更加类型安全和清晰的接口：

```typescript
import { EventBus } from '@tencent-app/ts-event-bus';

interface UserLoginEvent {
  userId: string;
  username: string;
}

const bus = new EventBus();
const loginChannel = bus.channel<UserLoginEvent>('user:login');

// 订阅
loginChannel.subscribe(async (event) => {
  console.log('User logged in:', event.username);
});

// 分发
loginChannel.dispatch({ userId: '123', username: 'alice' });
```

### 远程事件总线

`RemoteEventBus` 支持将事件发布到远程服务器：

```typescript
import { RemoteEventBus } from '@tencent-app/ts-event-bus';

// 创建远程事件总线
const remoteBus = new RemoteEventBus((topic, event) => {
  // 自定义发布逻辑，例如通过 WebSocket 发送
  websocket.send(JSON.stringify({ topic, event }));
});

// 本地订阅（接收来自服务器的事件）
remoteBus.subscribe('chat:message', async (message) => {
  console.log('New message:', message);
});

// 远程发布（发送到服务器）
remoteBus.publish('chat:message', { text: 'Hello!', from: 'alice' });

// 本地分发（不会发送到服务器）
remoteBus.dispatch('chat:message', { text: 'Local message', from: 'bob' });
```

### Publisher Channel

针对远程事件总线，可以使用 PublisherChannel：

```typescript
const publisherChannel = remoteBus.publisherChannel<ChatMessage>('chat:message');

publisherChannel.publish({ text: 'Hello!', from: 'alice' });
```

### 监听订阅变化

可以监听主题订阅者的变化：

```typescript
bus.onSubscriberChange((topics, change) => {
  if (change.added) {
    console.log(`New subscription to: ${change.added}`);
    console.log(`Active topics: ${topics.join(', ')}`);
  }
  if (change.removed) {
    console.log(`Unsubscribed from: ${change.removed}`);
  }
});
```

## API 文档

### EventBus

#### 方法

- `subscribe(topic: string, subscriber: (event: any) => Promise<void>): () => void`
  - 订阅主题，返回取消订阅函数
  
- `unsubscribe(topic: string, subscriber: (event: any) => Promise<void>): void`
  - 取消订阅
  
- `dispatch(topic: string, event: any): void`
  - 本地分发事件
  
- `channel<T>(topic: string): Channel<T>`
  - 创建双向 Channel（支持订阅和分发）
  
- `subscriberChannel<T>(topic: string): SubscriberChannel<T>`
  - 创建只读 Channel（仅支持订阅）
  
- `dispatcherChannel<T>(topic: string): DispatcherChannel<T>`
  - 创建只写 Channel（仅支持分发）
  
- `onSubscriberChange(handler: (topics: string[], change: { added?: string; removed?: string }) => void): () => void`
  - 监听订阅者变化
  
- `topics(): string[]`
  - 获取所有有订阅者的主题列表
  
- `countTopicSubscribers(): Record<string, number>`
  - 获取每个主题的订阅者数量

### RemoteEventBus

继承自 `EventBus`，额外提供：

#### 方法

- `publish(topic: string, event: any): void`
  - 发布事件到远程
  
- `setPublishProvider(publishProvider: (topic: string, event: any) => void): void`
  - 设置发布提供者
  
- `publisherChannel<T>(topic: string): PublisherChannel<T>`
  - 创建发布 Channel

## 开发

```bash
# 安装依赖
npm install

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 构建
npm run build

# 清理
npm run clean
```

## License

ISC

