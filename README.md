# Use global Angular-style services with your React application.

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
        this.name$ = new Observable('<insert name>');
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
    return (
        <div >
            <GreetUser />
            <NameInput />
        </div>
    );
}
```


A `useService` hook that accepts the service and service property is provided. It returns either some state or a method from the service.  Creating a custom hook for a services is very simple:

```typescript
import { useService } from "react-services";
import NameService from "../services/NameService";

export const useNameService = (property: string) => {
  return useService(NameService, property);
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

// Or use if you prefer TypeScript
class NameService {
    constructor(
        private someService: SomeService, 
        private someOtherService: someOtherService
    ) {}
}
```


So that's really all there is to it.  Mark your services with the `Service` decorator, and use the `useService` hook to access them.  Use observables for any service state that is going to be updated.

## Caveats

Right now, only classes that utilize the `@Service` decorator, can be injected.  Trying to inject anything else will cause nasty errors.  I'm hoping to eventually update this to allow injecting other things.

All services are global singletons.  Utility classes and unique instances of services are not supported yet.

As stated before, the provided `Observable` class should not be used for anything more than a really basic, throw-away application.  Seriously, use RxJS instead.  It's amazing.

This library is untested and unproven.  Maybe I'll write out some robusts automated test and build something worthwhile with it at some point.
