
# promise-filter-chain

## Summary

A generic filter-chain with promises. Each filter returns a truthy value
to continue the chain. Each filter can read and manipulate a `data` object.

## Usage

```
npm install --save promise-filter-chain
```

```javascript
const FilterChain = require('promise-filter-chain');

// filter to log http events
const eventLogger = {
  process: event => {
    const { request } = event;
    console.log(`${request.httpMethod} ${request.path}`);
    return Promise.resolve(true);
  }
};

// filter to authenticate http events
const authenticator = {
  process: event => {
    if (event.request.headers.Cookie['user-id'] !== 'authenticated user') {
      event.response.statusCode = 403;
      return Promise.resolve(false);
    } else {
      return Promise.resolve(true);
    }
  }
};

// filter chain for all requests
const filterChain = new FilterChain([
  eventLogger,
  authenticator
]);

// handler for a some API endpoint
const controller = {
  process: event => {
    event.response.statusCode = 200;
    // retrieve some data from business logic
    // respond to http request:
    event.response.body = {
      name: 'Corey',
      awesome: true
    };
  }
}

// process an http event
return filterChain.wrapInChain(incomingHttpEvent, controller);
```
