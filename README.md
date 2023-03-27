# Use global Angular-style services into your React application.

[Example application](https://github.com/gregoriB/example-react-services-app)

Provides a service decorator, and a `useService` hook to access the service.  The hook allows access to service methods, getters/setters, and observable values.

## State management
 
NOTE: While state managment using services requires the use of an observable, the observable included with the library is very limited and only exists for testing purposes and really basic examples.  Any serious applications should be using a more mature library, such as RxJS, for providing observables.

Example for how to use services for global state management:

```typescript
import { Service, Observable } from 'react-services';

@Service()
class NameService {
    constructor() {
        this.name$ = new Observable('');
    }

    setName = (name) => {
        this.name$.next(name);
    }
}

// React components
import { useNameService } from '../hooks/useNameService';

const GreetUser = () => {
    const name = useNameService('name$');
    
    return <h1>Hello, {{ name }}</h1>
}

const NameInput = () => {
    const setName = useNameService('setName');
    
    return <input onChange={e => setName(e.target.value)} />
}

const App = () => {
    return <GreetUser />
}
```


A `useService` hook that accepts the service and service property is provided.  Creating a custom hook for a services is very simple:

```typescript
import { useService } from "react-services";
import NameService from "../services/NameService";

export const useNameService = (property: string) => {
  const serviceProperty = useService(NameService, property);

  return serviceProperty;
};

```


Services can have other services as dependencies as well, and those will be automatically injected.  They must be provided in the same order in both the `providers` array, and the constructor arguments.  eg:

```typescript
import { Service } from 'react-services';
import SomeService from './someService';
import SomeOtherService from './someOtherService';

@Service({
  providers: [SomeService, SomeOtherService]
})
class NameService {
    constructor(someService, someOtherService) {
        this.someService = someService;
        this.someOtherService = someOtherService;
    }
}
```


So that's really all there is to it.  Mark your services with the `Service` decorator, and use the `useService` hook to access them.  Use observables for any service state that is going to be updated.
