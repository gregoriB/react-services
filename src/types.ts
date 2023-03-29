import { Context } from "react";

export type ContextInstance = Context<IServiceInstance>;
export type ContextInstances = Map<string, ContextInstance>;

export type Provider<T = any> = IServiceClass<T> | IServiceInstance;
export type Providers = Map<string, Provider>;

export type Observer = (val: ObservedValue) => void;
export type ObservedValue = any;

export interface IServiceClass<T = any> {
  name: string;
  [key: string]: any;
  new (...args: any[]): T;
}
export interface IServiceInstance {
  [key: string]: any;
}

export interface IServiceFormattedConfig {
  cls: IServiceClass;
  config: {
    providers: Providers;
  };
}
export interface IServiceConfig {
  providers?: IServiceClass<any>[];
}

interface IUnsubscribable {
  [key: string]: any;
  unsubscribe: () => void;
}
interface ISubscribable {
  [key: string]: any;
  subscribe: (val: any) => IUnsubscribable;
}

export function isSubscribable(obs: any): obs is ISubscribable {
  return typeof obs?.subscribe === 'function';
}
