import { useContext, useEffect, useState, createContext } from "react";
import {
  ContextInstance,
  ContextInstances,
  contexts$,
  IServiceClass
} from "./private-api";

// TODO: Find better approach to allow for all context to be available
// before the components load and this hooks gets used so we don't need
// this hack.
const defaultContext = createContext({ default: true } as {});
/**
 * Get a service with context/
 */
export const useServiceContext = (service: IServiceClass) => {
  const [context, setContext] = useState<ContextInstance>(defaultContext);
  const serviceContext = useContext(context);

  useEffect(() => {
    return contexts$.subscribe((contexts: ContextInstances): void => {
      const context = contexts.get(service.name + "Context");
      if (context) {
        setContext(context);
      }
    }).unsubscribe;
  }, [service]);

  return serviceContext;
};
