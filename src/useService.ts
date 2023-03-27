import { useEffect, useState } from "react";
import { Observable, IServiceClass } from "./private-api";
import { useServiceInstance } from "./useServiceInstance";

/**
 * Get an property value from a service.
 */
export const useService = (service: IServiceClass, property: string) => {
  const injectedService = useServiceInstance(service);
  const [injectedServiceProperty, setInjectedServiceProperty] = useState(
    service[property]
  );

  useEffect((): any => {
    if (!injectedService) {
      return;
    }

    const serviceProperty = injectedService[property];

    if (!serviceProperty) {
      throw new Error(`"${property}" does not exist on ${service.name}`);
    }

    // Subscribe the state to the observable value, and provide an
    // unsubscribe callback for unmount.
    if (serviceProperty.subscribe) {
      return (serviceProperty as Observable).subscribe(
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
      setInjectedServiceProperty(() => serviceProperty);
      return;
    }

    throw new Error(
      `"${property}" is not accessible.  Only methods, getters, setters, and observable values can be accessed on a service!`
    );
  }, [injectedService, property, service]);

  return injectedServiceProperty;
};
