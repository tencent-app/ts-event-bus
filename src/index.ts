
export class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private subscribers: Map<string, Set<(event: any) => Promise<void>>> =
    new Map();
  private subscriberChangeHandlers: Set<
    (topics: string[], change: { added?: string; removed?: string }) => void
  > = new Set();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public subscribe(
    topic: string,
    subscriber: (event: any) => Promise<void>
  ): () => void {
    const set = this.subscribers.get(topic) ?? new Set();
    const wasEmpty = set.size === 0;
    set.add(subscriber);
    this.subscribers.set(topic, set);
    if (wasEmpty) {
      const topics = this.topics();
      this.subscriberChangeHandlers.forEach((fn) =>
        fn(topics, { added: topic })
      );
    }
    return () => this.unsubscribe(topic, subscriber);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public unsubscribe(
    topic: string,
    subscriber: (event: any) => Promise<void>
  ): void {
    const set = this.subscribers.get(topic);
    if (!set) {
      return;
    }

    const exists = set.delete(subscriber);
    if (!exists) {
      return;
    }

    if (set.size === 0) {
      this.subscribers.delete(topic);
      const topics = this.topics();
      this.subscriberChangeHandlers.forEach((fn) =>
        fn(topics, { removed: topic })
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public dispatch(topic: string, event: any): void {
    this.subscribers.get(topic)?.forEach((subscriber) =>
      subscriber(event).catch((error) => {
        // eslint-disable-next-line no-console
        console.error("EventBus emit error: " + error);
      })
    );
  }

  public onSubscriberChange(
    handler: (
      topics: string[],
      change: { added?: string; removed?: string }
    ) => void
  ): () => void {
    this.subscriberChangeHandlers.add(handler);
    return () => this.offSubscriberChange(handler);
  }

  public offSubscriberChange(
    handler: (
      topics: string[],
      change: { added?: string; removed?: string }
    ) => void
  ): void {
    this.subscriberChangeHandlers.delete(handler);
  }

  public countTopicSubscribers(): Record<string, number> {
    const result: Record<string, number> = {};
    this.subscribers.forEach((subscribers, topic) => {
      result[topic] = subscribers.size;
    });
    return result;
  }

  public topics(): string[] {
    return Array.from(this.subscribers.keys());
  }

  public channel<T>(topic: string): Channel<T> {
    return new ChannelImpl<T>(this, topic);
  }

  public subscriberChannel<T>(topic: string): SubscriberChannel<T> {
    return new ChannelImpl<T>(this, topic);
  }

  public dispatcherChannel<T>(topic: string): DispatcherChannel<T> {
    return new ChannelImpl<T>(this, topic);
  }
}

export class RemoteEventBus extends EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private publishProvider?: (topic: string, event: any) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(publishProvider?: (topic: string, event: any) => void) {
    super();
    this.publishProvider = publishProvider;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public setPublishProvider(
    publishProvider: (topic: string, event: any) => void
  ): void {
    this.publishProvider = publishProvider;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public publish(topic: string, event: any): void {
    if (this.publishProvider) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.publishProvider(topic, event as any);
    } else {
      throw new Error(
        "RemoteEventBus is not initialized. Please ensure that the instance is properly configured before making requests."
      );
    }
  }

  public publisherChannel<T>(topic: string): PublisherChannel<T> {
    return new PublisherChannelImpl<T>(this, topic);
  }
}

export interface DispatcherChannel<T> {
  dispatch(event: T): void;
}

export interface SubscriberChannel<T> {
  subscribe(subscriber: (event: T) => Promise<void>): () => void;
  unsubscribe(subscriber: (event: T) => Promise<void>): void;
}

export interface PublisherChannel<T> {
  publish(event: T): void;
}

export interface Channel<T> extends DispatcherChannel<T>, SubscriberChannel<T> {
  readonly topic: string;
}

class ChannelImpl<T> implements Channel<T> {
  public readonly topic: string;
  private readonly bus: EventBus;
  constructor(bus: EventBus, topic: string) {
    this.topic = topic;
    this.bus = bus;
  }

  public dispatch(event: T): void {
    this.bus.dispatch(this.topic, event);
  }

  public subscribe(subscriber: (event: T) => Promise<void>): () => void {
    return this.bus.subscribe(this.topic, subscriber);
  }

  public unsubscribe(subscriber: (event: T) => Promise<void>): void {
    this.bus.unsubscribe(this.topic, subscriber);
  }
}

class PublisherChannelImpl<T> implements PublisherChannel<T> {
  public readonly topic: string;
  private readonly bus: RemoteEventBus;
  constructor(bus: RemoteEventBus, topic: string) {
    this.topic = topic;
    this.bus = bus;
  }

  public publish(event: T): void {
    this.bus.publish(this.topic, event);
  }
}

export const remoteEventBus = new RemoteEventBus();
