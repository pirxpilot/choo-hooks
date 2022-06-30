[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# choo-hooks

Fork of [choo-hooks].
Hook into Choo's events and timings. Useful to create loggers, analytics and
more.

## Usage
```js
var Hooks = require('choo-hooks')
var choo = require('choo')

var app = choo()
app.use(function (state, emitter) {
  var hooks = Hooks(emitter)
  hooks.on('event', function (eventName, timing, data) {
    console.log(eventName + ':', timing.duration + 'ms', data)
  })

  hooks.on('unhandled', function (eventName, data) {
    console.error('No listeners for ' + eventName)
  })
})
```

## API
### hooks = Hooks(emitter)
Create a new Choo Hooks instance.

### `hook.on('log:trace', cb(…args))`
### `hook.on('log:debug', cb(…args))`
### `hook.on('log:info', cb(…args))`
### `hook.on('log:warn', cb(…args))`
### `hook.on('log:error', cb(…args))`
### `hook.on('log:fatal', cb(…args))`
Listen for log events.

### `hook.on('service-worker', cb(data))`
Listen for service worker event.

### `hook.on('event', cb(eventName, timing, data))`
Called for events implemented at the application layer.

### `hook.on('unhandled', cb(eventName, data))`
Called whenever an event is emitted, and there is no handler available.

### `hook.on('DOMContentLoaded', cb(timing))`
Called whenever the DOM has loaded. Returns the `window.performance.timing`
object.

### `hook.on('render', cb(timings))`
Called whenever Choo renders. Returns an object with the `render` and `morph`
properties.

### `hook.on('resourceTimingBufferFull', cb())`
Called whenever the browser's resource timing buffer has filled up.

## License
[MIT](https://tldrlegal.com/license/mit-license)


[choo-hooks]: https://npmjs.org/package/choo-hooks

[npm-image]: https://img.shields.io/npm/v/@pirxpilot/choo-hooks
[npm-url]: https://npmjs.org/package/@pirxpilot/choo-hooks

[build-url]: https://github.com/pirxpilot/choo-hooks/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/workflow/status/pirxpilot/choo-hooks/check

[deps-image]: https://img.shields.io/librariesio/release/npm/@pirxpilot/choo-hooks
[deps-url]: https://libraries.io/npm/@pirxpilot%2Fchoo-hooks
