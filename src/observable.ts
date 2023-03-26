import { ISubscribeReturn, ObservedValue, Observer } from "./private-api";

export class Observable {
  protected _observers = new Set<Observer>();

  constructor(protected _value: ObservedValue) {}

  subscribe = (observer: Observer): ISubscribeReturn => {
    this.addObserver(observer);
    observer(this._value);
    return {
      unsubscribe: (): void => {
        this.removeObserver(observer);
      }
    };
  };

  next = (newValue: ObservedValue): void => {
    this._value = newValue;
    this.notify();
  };

  protected removeObserver = (observer: Observer): void => {
    this._observers.delete(observer);
  };

  protected notify = (): void => {
    this._observers.forEach((observer: Observer) => observer(this._value));
  };

  protected addObserver = (observer: Observer): void => {
    this._observers.add(observer);
  };
}
