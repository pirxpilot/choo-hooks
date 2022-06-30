const scheduler = require('@pirxpilot/nanoscheduler')()
const assert = require('assert')

/* global PerformanceObserver */

module.exports = chooHooks

const HAS_PERFORMANCE = typeof window === 'object' && !!window?.performance?.getEntriesByName

function chooHooks (_emitter) {
  assert(typeof _emitter === 'object')

  const _listeners = {}
  const _buffer = {
    render: {},
    events: {}
  }
  return {
    on,
    start
  }

  function on (name, handler) {
    _listeners[name] = handler
  }

  function start () {
    if (HAS_PERFORMANCE) {
      window.performance.onresourcetimingbufferfull = () => {
        const listener = _listeners['resource-timing-buffer-full']
        if (listener) listener()
      }
    }

    const po = new PerformanceObserver(list => list.getEntries().forEach(onTiming))
    po.observe({ type: 'measure' })

    // TODO also handle log events
    function onTiming (timing) {
      const eventName = timing.name
      if (/choo\.morph/.test(eventName)) {
        _buffer.render.morph = timing
      } else if (/choo\.route/.test(eventName)) {
        _buffer.render.route = timing
      } else if (/choo\.render/.test(eventName)) {
        _buffer.render.render = timing
      } else if (/choo\.emit/.test(eventName) && !/log:/.test(eventName)) {
        const eventListener = _listeners.event
        if (eventListener) {
          const timingName = eventName.match(/choo\.emit\('(.*)'\)/)[1]
          if (timingName === 'render' || timingName === 'DOMContentLoaded') return

          const traceId = eventName.match(/\[(\d+)\]/)[1]
          const data = _buffer.events[traceId]

          _buffer.events[traceId] = null
          eventListener(timingName, data, timing)
        }
      }

      const rBuf = _buffer.render
      if (rBuf.render && rBuf.route && rBuf.morph) {
        const renderListener = _listeners.render
        if (!renderListener) return
        const timings = {}
        while (_buffer.render.length) {
          const _timing = _buffer.render.pop()
          const name = _timing.name
          if (/choo\.render/.test(name)) timings.render = _timing
          else if (/choo\.morph/.test(name)) timings.morph = _timing
          else timings.route = _timing
        }
        rBuf.render = rBuf.route = rBuf.morph = undefined
        renderListener(timings)
      }
    }

    // Check if there's timings without any listeners
    // and trigger the DOMContentLoaded event.
    // If the timing API is not available, we handle all events here
    this.emitter.on('*', function (eventName, data, uuid) {
      let logLevel = /^log:(\w{4,5})/.exec(eventName)

      if (!HAS_PERFORMANCE && eventName === 'render') {
        // Render
        const renderListener = _listeners.render
        if (renderListener) renderListener()
      } else if (eventName === 'DOMContentLoaded') {
        // DOMContentLoaded
        _emitLoaded()
      } else if (logLevel) {
        logLevel = logLevel[1]
        // Log:*
        const logListener = _listeners[`log:${logLevel}`]
        if (logListener) {
          logListener(...Array.prototype.slice.call(arguments, 0, arguments.length - 1))
        }
      } else if (!_emitter.listeners(eventName).length) {
        // Unhandled
        const unhandledListener = _listeners.unhandled
        if (unhandledListener) unhandledListener(eventName, data)
      } else if (eventName !== 'render') {
        // *
        if (window.performance) _buffer.events[uuid] = data
      }
    })
  }

  // compute and log time till interactive when DOMContentLoaded event fires
  function _emitLoaded () {
    scheduler.push(() => {
      const listener = _listeners.DOMContentLoaded
      const timing = window.performance.timing

      if (listener && timing) {
        listener({
          interactive: timing.domInteractive - timing.navigationStart,
          loaded: timing.domContentLoadedEventEnd - timing.navigationStart
        })
      }
    })
  }
}
