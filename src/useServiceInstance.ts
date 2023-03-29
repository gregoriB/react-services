import { useState, useEffect } from 'react';
import { instances$ } from './private-api';
import { IServiceClass } from './types';

/**
 * Get a service instance if available in the stored instances.
 */
export const useServiceInstance = <T>(service: IServiceClass<T>): T => {
  const [instance, setInstance] = useState<T>();

  useEffect((): (() => void) => {
    return instances$.subscribe((instances: Map<string, T>) => {
      const instance = instances.get(service.name);
      if (instance) {
        setInstance(instance as T);
      }
    }).unsubscribe;
  }, []);

  return instance;
}
