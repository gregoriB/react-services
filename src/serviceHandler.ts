import { createContext } from "react";
import {
  ContextInstance,
  ContextInstances,
  IServiceClass,
  IServiceConfig,
  IServiceFormattedConfig,
  IServiceInstance,
  Observable,
  Observer,
  Provider
} from "./private-api";

class MutableObservable<T> extends Observable<T> {
  constructor(protected _value: T) {
    super(_value);
  }

  mutate = (fn: Observer) => {
    fn(this._value);
    this.notifyObservers();
  };
}

/**
 * Handles instantiating service singletons and setting up them up
 * as context providers.
 */
class ServiceHandler {
  services$ = new MutableObservable(new Map<string, IServiceFormattedConfig>());
  instances$ = new Observable(new Map<string, IServiceInstance>());
  contexts$ = new Observable(new Map<string, ContextInstance>());

  constructor() {
    this.services$.subscribe((services): void =>
      this.setupServices(new Map(services))
    );
  }

  /**
   * Creates a service config with an service class and map of providers,
   * then updates the services$ observable with the new config.
   */
  Service = (config: IServiceConfig = {}) => {
    const providersFormattedArr =
      config.providers?.map((p: IServiceClass): [string, IServiceClass] => [
        p.name,
        p
      ]) || [];
    const formattedConfig: IServiceFormattedConfig["config"] = {
      providers: new Map<string, Provider>(providersFormattedArr)
    };

    return (cls: IServiceClass): void => {
      this.services$.mutate((services): void => {
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
   * Checks that the correct number of dependencies are being injected in the constructor,
   * as specified by the providers array.  Does not check that the correct dependencies will be
   * injected. TODO: Come up with a better check.  It should check the dependencies after
   * instantiation against the providers from the array, and give specific dependency names
   * in the error message.
   */
  isMissingProviderOrDependency = (service: IServiceFormattedConfig, providersArr: IServiceClass[]): boolean => {
      const clsStr = service.cls.prototype.constructor.toString();
      const isMissingNecessaryConstructor = providersArr.length && !clsStr.includes('constructor(');
      if (isMissingNecessaryConstructor) {
          throw new Error(
            `Missing dependencies in the class ${service.cls.name} constructor. Please make sure all dependencies specified in the "providers" array are being injected`
          );
      }
      if (clsStr.includes('constructor(')) {
        const slice = clsStr.slice(clsStr.indexOf('constructor(') + 12, clsStr.indexOf(')'))
        const clsDeps = slice.replace(/\n/g, '').replace(/,/, ' ').split(' ').filter((str: string) => !!str);
        if (clsDeps.length !== providersArr.length) {
          throw new Error(
            `Missing dependencies for ${service.cls.name}. Please make sure all dependencies are specified in the "providers" array in the service config`
          );
        }
      }
  }

  /**
   * Creates a map of instantiated service classes from a service
   * config map.  Injects service dependencies and creates creates
   * a context object for each instance.
   * TODO: Figure out how to stop endless loop when something that is
   * not a service is provided in a dependencies array.  Right now,
   * only services that use a decorator can be injected. Would be ideal
   * if anything could be injected.  The issue is that we can't check
   * if a provided dependency is a service, since this function currently
   * gets run every time a new service is added, which probably means
   * there are other issues I'm not aware of.
   */
  setupServices = (
    services = new Map<string, IServiceFormattedConfig>(),
    instances = new Map<string, IServiceInstance>()
  ) => {
    services.forEach((service: IServiceFormattedConfig, skey: string): void => {
      const providersArr = Array.from(service.config.providers);
      this.isMissingProviderOrDependency(service, providersArr);
      const isInstance = (
        cls: IServiceInstance | IServiceClass
      ): cls is IServiceInstance => {
        return (cls as IServiceInstance).constructor.name !== "Function";
      };
      if (instances.has(skey)) {
        return;
      }
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
      this.instances$.next(instances);
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
export const instances$ = serviceHander.instances$;
