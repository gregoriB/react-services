import { Context } from "react";

export type ContextInstance = Context<IServiceInstance>;
export type ContextInstances = Map<string, ContextInstance>;

export type Provider = IServiceClass | IServiceInstance;
export type Providers = Map<string, Provider>;

export type Observer = (val: ObservedValue) => void;
export type ObservedValue = any;

export interface ISubscribeReturn {
  unsubscribe: () => void;
}
export interface IServiceClass {
  name: string;
  [key: string]: any;
  new (...args: any): IServiceInstance;
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
  providers: IServiceClass[];
}
