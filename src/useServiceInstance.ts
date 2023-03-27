import { useState, useEffect } from 'react';
import { instances$ } from './private-api';
import { IServiceClass, IServiceInstance } from './types';

/**
 * Get a service instance if available in the stored instances.
 */
export const useServiceInstance = (service: IServiceClass) => {
  const [instance, setInstance] = useState(null);

  useEffect((): any => {
    return instances$.subscribe((instances: Map<string, IServiceInstance>) => {
      const instance = instances.get(service.name);
      if (instance) {
        setInstance(instance);
      }
    }).unsubscribe;
  }, []);

  return instance;
}
