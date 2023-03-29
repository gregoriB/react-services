import { useEffect, useState } from "react";
import { IServiceClass, isSubscribable } from "./private-api";
import { useServiceInstance } from "./useServiceInstance";

/**
 * Get an property value from a service.
 */
export const useService = <T>(service: IServiceClass<T>, property: keyof T): T[keyof T] => {
  // TODO: Look into whether or not there is any benefit to using
  // useServiceContext here instead to get a context object, instead of
  // using the instantiated class directly.
  const injectedService = useServiceInstance<T>(service);
  const [injectedServiceProperty, setInjectedServiceProperty] = useState<T[keyof T]>();

  useEffect((): (() => void) | undefined => {
    if (!injectedService) {
      return;
    }

    const hasProperty = injectedService.hasOwnProperty(property);

    if (!hasProperty) {
      throw new Error(`"${property}" does not exist on ${service.name}`);
    }

    const serviceProperty = injectedService[property];


    // Subscribe the state to the observable value, and provide an
    // unsubscribe callback for unmount.
    if (isSubscribable(serviceProperty)) {
      return (serviceProperty).subscribe(
        setInjectedServiceProperty
      ).unsubscribe;
    }

    // It seems that `Object.getOwnPropertyDescriptor` will return undefined
    // for getters and setters, so we assume this is the case if our property
    // returns undefined.
    // TODO: Look into pitfalls and alternative approaches.
    const isGetterSetter = !Boolean(
      Object.getOwnPropertyDescriptor(injectedService, property)
    );

    if (typeof serviceProperty === "function" || isGetterSetter) {
      setInjectedServiceProperty((() => serviceProperty));
      return;
    }

    throw new Error(
      `"${property}" is not accessible.  Only methods, getters, setters, and observable values can be accessed on a service!`
    );
  }, [injectedService, property, service]);

  return injectedServiceProperty;
};
