import { createContext } from "react";
import {
  ContextInstance,
  ContextInstances,
  IServiceClass,
  IServiceConfig,
  IServiceFormattedConfig,
  IServiceInstance,
  Observable,
  ObservedValue,
  Observer,
  Provider
} from "./private-api";

class MutableObservable extends Observable {
  constructor(protected _value: ObservedValue) {
    super(_value);
  }

  mutate = (fn: Observer) => {
    fn(this._value);
    this.notify();
  };
}

/**
 * Handles instantiating service singletons and setting up them up
 * as context providers.
 */
class ServiceHandler {
  services$ = new MutableObservable(new Map<string, IServiceFormattedConfig>());
  contexts$ = new Observable(new Map<string, ContextInstance>());

  constructor() {
    this.services$.subscribe((services) =>
      this.setupServices(new Map(services))
    );
  }

  /**
   * Creates a service config with an service class and map of providers,
   * then updates the services$ observable with the new config.
   */
  Service = (config: IServiceConfig) => {
    const providersFormattedArr =
      config.providers.map((p: IServiceClass): [string, IServiceClass] => [
        p.name,
        p
      ]) || [];
    const formattedConfig: IServiceFormattedConfig["config"] = {
      providers: new Map<string, Provider>(providersFormattedArr)
    };

    return (cls: IServiceClass): void => {
      this.services$.mutate((services) => {
        services.set(cls.name, { cls, config: formattedConfig });
      });
    };
  };

  /**
   * Accepts a service config with a class to be instantiated, and
   * an array of dependencies to be injected.  Instantiates the service
   * with its dependencies and marks it as an instance.
   */
  createInstance = (service: IServiceFormattedConfig): IServiceInstance => {
    const providersArr = Array.from(service.config.providers.values());
    const instance = new service.cls(...providersArr);
    return instance;
  };

  /**
   * Creates a map of instantiated service classes from a service
   * config map.  Injects service dependencies and creates creates
   * a context object for each instance.
   */
  setupServices = (
    services = new Map<string, IServiceFormattedConfig>(),
    instances = new Map<string, IServiceInstance>()
  ) => {
    services.forEach((service: IServiceFormattedConfig, skey: string): void => {
      const isInstance = (
        cls: IServiceInstance | IServiceClass
      ): cls is IServiceInstance => {
        return (cls as IServiceInstance).constructor.name !== "Function";
      };
      if (instances.has(skey)) {
        return;
      }
      const providersArr = Array.from(service.config.providers);
      if (
        providersArr.every(([_, value]: [string, Provider]): boolean =>
          isInstance(value)
        )
      ) {
        // Providers are all instantiated, so we can instantiate this service
        // and remove it from the service map.
        instances.set(skey, this.createInstance(service));
        services.delete(skey);
        return;
      }
      // Loop through service provider array to replace provider classes with
      // an instance of that provider.

      providersArr.forEach(
        ([key, value]: [string, IServiceClass | IServiceInstance]): void => {
          if (isInstance(value)) {
            return;
          }
          // If a provider has an instance, replace the provider class from
          // the service.config.providers map with the instance.
          const instantiatedProvider = instances.get(key);
          if (instantiatedProvider) {
            service.config.providers.set(key, instantiatedProvider);
          }
        }
      );
    });
    // Once all services have been instantiated, we are done.
    if (!services.size) {
      this.contexts$.next(this.createContexts(instances));
      return;
    }

    this.setupServices(services, instances);
  };

  /**
   * Creates a map of contexts from a map of instances.
   */
  createContexts = (
    instances: Map<string, IServiceInstance>
  ): ContextInstances => {
    // const instancesArr = Array.from(instances.values());
    const newContextsMap: ContextInstances = new Map();
    instances.forEach((instance: IServiceInstance, ikey: string) => {
      newContextsMap.set(ikey + "Context", createContext(instance));
    });
    return newContextsMap;
  };
}

const serviceHander = new ServiceHandler();

export const Service = serviceHander.Service;
export const contexts$ = serviceHander.contexts$;
