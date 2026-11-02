import type { EventHandler, EventOfType, TypedEvent, Unsubscribe } from './TypedEvent.ts';

export class TypedEventBus<TEvent extends TypedEvent> {
  private readonly handlersByType = new Map<TEvent['type'], Set<EventHandler<TEvent>>>();
  private readonly wildcardHandlers = new Set<EventHandler<TEvent>>();

  on<TType extends TEvent['type']>(
    type: TType,
    handler: EventHandler<EventOfType<TEvent, TType>>,
  ): Unsubscribe {
    const handlers = this.handlersByType.get(type) ?? new Set<EventHandler<TEvent>>();
    this.handlersByType.set(type, handlers);
    const erased = handler as EventHandler<TEvent>;
    handlers.add(erased);
    return () => {
      handlers.delete(erased);
    };
  }

  onAny(handler: EventHandler<TEvent>): Unsubscribe {
    this.wildcardHandlers.add(handler);
    return () => {
      this.wildcardHandlers.delete(handler);
    };
  }

  emit(event: TEvent): void {
    const handlers = this.handlersByType.get(event.type);
    if (handlers !== undefined) {
      for (const handler of [...handlers]) {
        handler(event);
      }
    }
    for (const handler of [...this.wildcardHandlers]) {
      handler(event);
    }
  }

  clear(): void {
    this.handlersByType.clear();
    this.wildcardHandlers.clear();
  }
}
