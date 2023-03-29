import { ISubscribeReturn, ObservedValue, Observer } from "./private-api";

export class Observable<T> {
  protected _observers = new Set<Observer>();

  constructor(protected _value: T) {}

  subscribe = (observer: Observer): { unsubscribe: () => void } => {
    this.addObserver(observer);
    observer(this._value);

    return {
      unsubscribe: (): void => {
        this.removeObserver(observer);
      }
    };
  };

  next = (newValue: T): void => {
    this._value = newValue;
    this.notifyObservers();
  };

  protected removeObserver = (observer: Observer): void => {
    this._observers.delete(observer);
  };

  protected notifyObservers = (): void => {
    this._observers.forEach((observer: Observer) => observer(this._value));
  };

  protected addObserver = (observer: Observer): void => {
    this._observers.add(observer);
  };
}
