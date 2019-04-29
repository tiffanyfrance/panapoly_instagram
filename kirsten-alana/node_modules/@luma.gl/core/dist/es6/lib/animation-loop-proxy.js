import { getPageLoadPromise, getCanvas } from '@luma.gl/webgl';
import { requestAnimationFrame, cancelAnimationFrame } from '@luma.gl/webgl';
import { log, assert } from '../utils';
export default class AnimationLoopProxy {
  static createWorker(animationLoop) {
    return self => {
      animationLoop.setProps({
        useDevicePixels: false,
        autoResizeDrawingBuffer: false
      });
      self.canvas = null;

      function initializeCanvas(canvas) {
        const eventHandlers = new Map();

        canvas.addEventListener = (type, handler) => {
          self.postMessage({
            command: 'addEventListener',
            type
          });

          if (!eventHandlers.has(type)) {
            eventHandlers.set(type, []);
          }

          eventHandlers.get(type).push(handler);
        };

        canvas.removeEventListener = (type, handler) => {
          self.postMessage({
            command: 'removeEventListener',
            type
          });
          const handlers = eventHandlers.get(type);

          if (handlers) {
            handlers.splice(handlers.indexOf(handler), 1);
          }
        };

        canvas.dispatchEvent = (type, event) => {
          const handlers = eventHandlers.get(type);

          if (handlers) {
            handlers.forEach(handler => handler(event));
          }
        };

        self.canvas = canvas;
      }

      self.addEventListener('message', evt => {
        switch (evt.data.command) {
          case 'start':
            initializeCanvas(evt.data.opts.canvas);
            animationLoop.start(evt.data.opts);
            break;

          case 'stop':
            animationLoop.stop();
            break;

          case 'resize':
            self.canvas.width = evt.data.width;
            self.canvas.height = evt.data.height;
            break;

          case 'event':
            self.canvas.dispatchEvent(evt.data.type, evt.data.event);
            break;

          default:
        }
      });
    };
  }

  constructor(worker) {
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    const _opts$onInitialize = opts.onInitialize,
          onInitialize = _opts$onInitialize === void 0 ? () => {} : _opts$onInitialize,
          _opts$onFinalize = opts.onFinalize,
          onFinalize = _opts$onFinalize === void 0 ? () => {} : _opts$onFinalize,
          _opts$useDevicePixels = opts.useDevicePixels,
          useDevicePixels = _opts$useDevicePixels === void 0 ? true : _opts$useDevicePixels,
          _opts$autoResizeDrawi = opts.autoResizeDrawingBuffer,
          autoResizeDrawingBuffer = _opts$autoResizeDrawi === void 0 ? true : _opts$autoResizeDrawi;
    this.props = {
      onInitialize,
      onFinalize
    };
    this.setProps({
      autoResizeDrawingBuffer,
      useDevicePixels
    });
    assert(worker instanceof Worker);
    this.worker = worker;
    this.canvas = null;
    this.width = null;
    this.height = null;
    this._running = false;
    this._animationFrameId = null;
    this._resolveNextFrame = null;
    this._nextFramePromise = null;
    this._onMessage = this._onMessage.bind(this);
    this._onEvent = this._onEvent.bind(this);
    this._updateFrame = this._updateFrame.bind(this);
  }

  setProps(props) {
    if ('autoResizeDrawingBuffer' in props) {
      this.autoResizeDrawingBuffer = props.autoResizeDrawingBuffer;
    }

    if ('useDevicePixels' in props) {
      this.useDevicePixels = props.useDevicePixels;
    }

    return this;
  }

  start() {
    let opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (this._running) {
      return this;
    }

    this._running = true;
    this.worker.onmessage = this._onMessage;
    getPageLoadPromise().then(() => {
      if (!this._running) {
        return null;
      }

      this._createAndTransferCanvas(opts);

      return this.props.onInitialize(this);
    }).then(() => {
      if (this._running) {
        this._animationFrameId = requestAnimationFrame(this._updateFrame);
      }
    });
    return this;
  }

  stop() {
    if (this._running) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
      this._running = false;
      this.props.onFinalize(this);
    }

    this.worker.postMessage({
      command: 'stop'
    });
    return this;
  }

  waitForRender() {
    if (!this._nextFramePromise) {
      this._nextFramePromise = new Promise(resolve => {
        this._resolveNextFrame = resolve;
      });
    }

    return this._nextFramePromise;
  }

  _onMessage(evt) {
    switch (evt.data.command) {
      case 'addEventListener':
        this.canvas.addEventListener(evt.data.type, this._onEvent);
        break;

      case 'removeEventListener':
        this.canvas.removeEventListener(evt.data.type, this._onEvent);
        break;

      default:
    }
  }

  _onEvent(evt) {
    const devicePixelRatio = this.useDevicePixels ? window.devicePixelRatio || 1 : 1;
    const type = evt.type;
    const safeEvent = {};

    for (const key in evt) {
      let value = evt[key];
      const valueType = typeof value;

      if (key === 'offsetX' || key === 'offsetY') {
        value *= devicePixelRatio;
      }

      if (valueType === 'number' || valueType === 'boolean' || valueType === 'string') {
        safeEvent[key] = value;
      }
    }

    this.worker.postMessage({
      command: 'event',
      type,
      event: safeEvent
    });
  }

  _updateFrame() {
    this._resizeCanvasDrawingBuffer();

    if (this._resolveNextFrame) {
      this._resolveNextFrame(this);

      this._nextFramePromise = null;
      this._resolveNextFrame = null;
    }

    this._animationFrameId = requestAnimationFrame(this._updateFrame);
  }

  _createAndTransferCanvas(opts) {
    const screenCanvas = getCanvas(opts);

    if (!screenCanvas.transferControlToOffscreen) {
      log.error('OffscreenCanvas is not available in your browser.')();
    }

    const offscreenCanvas = screenCanvas.transferControlToOffscreen();
    this.worker.postMessage({
      command: 'start',
      opts: Object.assign({}, opts, {
        canvas: offscreenCanvas
      })
    }, [offscreenCanvas]);
    this.canvas = screenCanvas;
  }

  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      const devicePixelRatio = this.useDevicePixels ? window.devicePixelRatio || 1 : 1;
      const width = this.canvas.clientWidth * devicePixelRatio;
      const height = this.canvas.clientHeight * devicePixelRatio;

      if (this.width !== width || this.height !== height) {
        this.width = width;
        this.height = height;
        this.worker.postMessage({
          command: 'resize',
          width,
          height
        });
      }
    }
  }

}
//# sourceMappingURL=animation-loop-proxy.js.map