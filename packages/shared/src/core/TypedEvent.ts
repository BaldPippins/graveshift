export type EventDiscriminant = string | number;

export interface TypedEvent<TType extends EventDiscriminant = EventDiscriminant> {
  readonly type: TType;
}

export type EventOfType<TEvent extends TypedEvent, TType extends TEvent['type']> = Extract<
  TEvent,
  TypedEvent<TType>
>;

export type EventHandler<TEvent> = (event: TEvent) => void;

export type Unsubscribe = () => void;
