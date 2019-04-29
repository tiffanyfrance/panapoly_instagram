import _asyncToGenerator from "@babel/runtime/helpers/esm/asyncToGenerator";
import { isWebGL, createGLContext, instrumentGLContext, resizeGLContext, resetParameters, requestAnimationFrame, cancelAnimationFrame, getPageLoadPromise, Query, lumaStats, Framebuffer } from '@luma.gl/webgl';
import { log, assert } from '../utils';
let statIdCounter = 0;
export default class AnimationLoop {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    const _props$onCreateContex = props.onCreateContext,
          onCreateContext = _props$onCreateContex === void 0 ? opts => createGLContext(opts) : _props$onCreateContex,
          _props$onAddHTML = props.onAddHTML,
          onAddHTML = _props$onAddHTML === void 0 ? null : _props$onAddHTML,
          _props$onInitialize = props.onInitialize,
          onInitialize = _props$onInitialize === void 0 ? () => {} : _props$onInitialize,
          _props$onRender = props.onRender,
          onRender = _props$onRender === void 0 ? () => {} : _props$onRender,
          _props$onFinalize = props.onFinalize,
          onFinalize = _props$onFinalize === void 0 ? () => {} : _props$onFinalize,
          _props$gl = props.gl,
          gl = _props$gl === void 0 ? null : _props$gl,
          _props$glOptions = props.glOptions,
          glOptions = _props$glOptions === void 0 ? {} : _props$glOptions,
          _props$debug = props.debug,
          debug = _props$debug === void 0 ? false : _props$debug,
          _props$createFramebuf = props.createFramebuffer,
          createFramebuffer = _props$createFramebuf === void 0 ? false : _props$createFramebuf,
          _props$autoResizeView = props.autoResizeViewport,
          autoResizeViewport = _props$autoResizeView === void 0 ? true : _props$autoResizeView,
          _props$autoResizeDraw = props.autoResizeDrawingBuffer,
          autoResizeDrawingBuffer = _props$autoResizeDraw === void 0 ? true : _props$autoResizeDraw,
          _props$stats = props.stats,
          stats = _props$stats === void 0 ? lumaStats.get("animation-loop-".concat(statIdCounter++)) : _props$stats;
    let _props$useDevicePixel = props.useDevicePixels,
        useDevicePixels = _props$useDevicePixel === void 0 ? true : _props$useDevicePixel;

    if ('useDevicePixelRatio' in props) {
      log.deprecated('useDevicePixelRatio', 'useDevicePixels')();
      useDevicePixels = props.useDevicePixelRatio;
    }

    this.props = {
      onCreateContext,
      onAddHTML,
      onInitialize,
      onRender,
      onFinalize,
      gl,
      glOptions,
      debug,
      createFramebuffer
    };
    this.gl = gl;
    this.needsRedraw = null;
    this.stats = stats;
    this.cpuTime = this.stats.get('CPU Time');
    this.gpuTime = this.stats.get('GPU Time');
    this.frameRate = this.stats.get('Frame Rate');
    this._initialized = false;
    this._running = false;
    this._animationFrameId = null;
    this._nextFramePromise = null;
    this._resolveNextFrame = null;
    this._cpuStartTime = 0;
    this.setProps({
      autoResizeViewport,
      autoResizeDrawingBuffer,
      useDevicePixels
    });
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this._onMousemove = this._onMousemove.bind(this);
    this._onMouseleave = this._onMouseleave.bind(this);
  }

  delete() {
    this.stop();

    this._setDisplay(null);
  }

  setNeedsRedraw(reason) {
    assert(typeof reason === 'string');
    this.needsRedraw = this.needsRedraw || reason;
    return this;
  }

  setProps(props) {
    if ('autoResizeViewport' in props) {
      this.autoResizeViewport = props.autoResizeViewport;
    }

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
    getPageLoadPromise().then(() => {
      if (!this._running || this._initialized) {
        return null;
      }

      this._createWebGLContext(opts);

      this._createFramebuffer();

      this._startEventHandling();

      this._initializeCallbackData();

      this._updateCallbackData();

      this._resizeCanvasDrawingBuffer();

      this._resizeViewport();

      this._gpuTimeQuery = Query.isSupported(this.gl, ['timers']) ? new Query(this.gl) : null;
      this._initialized = true;
      return this.onInitialize(this.animationProps);
    }).then(appContext => {
      if (this._running) {
        this._addCallbackData(appContext || {});

        if (appContext !== false) {
          this._startLoop();
        }
      }
    });
    return this;
  }

  redraw() {
    this._beginTimers();

    this._setupFrame();

    this._updateCallbackData();

    this._renderFrame(this.animationProps);

    this._clearNeedsRedraw();

    if (this.offScreen && this.gl.commit) {
      this.gl.commit();
    }

    if (this._resolveNextFrame) {
      this._resolveNextFrame(this);

      this._nextFramePromise = null;
      this._resolveNextFrame = null;
    }

    this._endTimers();

    return this;
  }

  stop() {
    if (this._running) {
      this._finalizeCallbackData();

      cancelAnimationFrame(this._animationFrameId);
      this._nextFramePromise = null;
      this._resolveNextFrame = null;
      this._animationFrameId = null;
      this._running = false;
    }

    return this;
  }

  waitForRender() {
    this.setNeedsRedraw('waitForRender');

    if (!this._nextFramePromise) {
      this._nextFramePromise = new Promise(resolve => {
        this._resolveNextFrame = resolve;
      });
    }

    return this._nextFramePromise;
  }

  toDataURL() {
    var _this = this;

    return _asyncToGenerator(function* () {
      _this.setNeedsRedraw('toDataURL');

      yield _this.waitForRender();
      return _this.gl.canvas.toDataURL();
    })();
  }

  onCreateContext() {
    return this.props.onCreateContext(...arguments);
  }

  onInitialize() {
    return this.props.onInitialize(...arguments);
  }

  onRender() {
    return this.props.onRender(...arguments);
  }

  onFinalize() {
    return this.props.onFinalize(...arguments);
  }

  getHTMLControlValue(id) {
    let defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    const element = document.getElementById(id);
    return element ? Number(element.value) : defaultValue;
  }

  setViewParameters() {
    log.removed('AnimationLoop.setViewParameters', 'AnimationLoop.setProps')();
    return this;
  }

  _startLoop() {
    const renderFrame = () => {
      if (!this._running) {
        return;
      }

      this.redraw();
      this._animationFrameId = this._requestAnimationFrame(renderFrame);
    };

    cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = this._requestAnimationFrame(renderFrame);
  }

  _setDisplay(display) {
    if (this.display) {
      this.display.delete();
      this.display.animationLoop = null;
    }

    if (display) {
      display.animationLoop = this;
    }

    this.display = display;
  }

  _requestAnimationFrame(renderFrameCallback) {
    if (this.display && this.display.requestAnimationFrame(renderFrameCallback)) {
      return;
    }

    requestAnimationFrame(renderFrameCallback);
  }

  _renderFrame() {
    if (this.display) {
      this.display._renderFrame(...arguments);

      return;
    }

    this.onRender(...arguments);
  }

  _clearNeedsRedraw() {
    this.needsRedraw = null;
  }

  _setupFrame() {
    if (this._onSetupFrame) {
      this._onSetupFrame(this.animationProps);
    } else {
      this._resizeCanvasDrawingBuffer();

      this._resizeViewport();

      this._resizeFramebuffer();
    }
  }

  _initializeCallbackData() {
    this.animationProps = {
      gl: this.gl,
      stop: this.stop,
      canvas: this.gl.canvas,
      framebuffer: this.framebuffer,
      useDevicePixels: this.useDevicePixels,
      needsRedraw: null,
      startTime: Date.now(),
      time: 0,
      tick: 0,
      tock: 0,
      _loop: this,
      _animationLoop: this,
      _mousePosition: null
    };
  }

  _updateCallbackData() {
    const _this$_getSizeAndAspe = this._getSizeAndAspect(),
          width = _this$_getSizeAndAspe.width,
          height = _this$_getSizeAndAspe.height,
          aspect = _this$_getSizeAndAspe.aspect;

    if (width !== this.animationProps.width || height !== this.animationProps.height) {
      this.setNeedsRedraw('drawing buffer resized');
    }

    if (aspect !== this.animationProps.aspect) {
      this.setNeedsRedraw('drawing buffer aspect changed');
    }

    this.animationProps.width = width;
    this.animationProps.height = height;
    this.animationProps.aspect = aspect;
    this.animationProps.needsRedraw = this.needsRedraw;
    this.animationProps.time = Date.now() - this.animationProps.startTime;
    this.animationProps.tick = Math.floor(this.animationProps.time / 1000 * 60);
    this.animationProps.tock++;
    this.animationProps._offScreen = this.offScreen;
  }

  _finalizeCallbackData() {
    this.onFinalize(this.animationProps);
  }

  _addCallbackData(appContext) {
    if (typeof appContext === 'object' && appContext !== null) {
      this.animationProps = Object.assign({}, this.animationProps, appContext);
    }
  }

  _createWebGLContext(opts) {
    this.offScreen = opts.canvas && typeof OffscreenCanvas !== 'undefined' && opts.canvas instanceof OffscreenCanvas;
    opts = Object.assign({}, opts, this.props.glOptions);
    this.gl = this.props.gl ? instrumentGLContext(this.props.gl, opts) : this.onCreateContext(opts);

    if (!isWebGL(this.gl)) {
      throw new Error('AnimationLoop.onCreateContext - illegal context returned');
    }

    resetParameters(this.gl);

    this._createInfoDiv();
  }

  _createInfoDiv() {
    if (this.gl.canvas && this.props.onAddHTML) {
      const wrapperDiv = document.createElement('div');
      document.body.appendChild(wrapperDiv);
      wrapperDiv.style.position = 'relative';
      const div = document.createElement('div');
      div.style.position = 'absolute';
      div.style.left = '10px';
      div.style.bottom = '10px';
      div.style.width = '300px';
      div.style.background = 'white';
      wrapperDiv.appendChild(this.gl.canvas);
      wrapperDiv.appendChild(div);
      const html = this.props.onAddHTML(div);

      if (html) {
        div.innerHTML = html;
      }
    }
  }

  _getSizeAndAspect() {
    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;
    let aspect = 1;
    const _this$gl$canvas = this.gl.canvas,
          clientWidth = _this$gl$canvas.clientWidth,
          clientHeight = _this$gl$canvas.clientHeight;

    if (clientWidth > 0 && clientHeight > 0) {
      aspect = clientWidth / clientHeight;
    } else if (width > 0 && height > 0) {
      aspect = width / height;
    }

    return {
      width,
      height,
      aspect
    };
  }

  _resizeViewport() {
    if (this.autoResizeViewport) {
      this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    }
  }

  _resizeCanvasDrawingBuffer() {
    if (this.autoResizeDrawingBuffer) {
      resizeGLContext(this.gl, {
        useDevicePixels: this.useDevicePixels
      });
    }
  }

  _createFramebuffer() {
    if (this.props.createFramebuffer) {
      this.framebuffer = new Framebuffer(this.gl);
    }
  }

  _resizeFramebuffer() {
    if (this.framebuffer) {
      this.framebuffer.resize({
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight
      });
    }
  }

  _beginTimers() {
    this.frameRate.timeEnd();
    this.frameRate.timeStart();

    if (this._gpuTimeQuery && this._gpuTimeQuery.isResultAvailable() && !this._gpuTimeQuery.isTimerDisjoint()) {
      this.stats.get('GPU Time').addTime(this._gpuTimeQuery.getTimerMilliseconds());
    }

    if (this._gpuTimeQuery) {
      this._gpuTimeQuery.beginTimeElapsedQuery();
    }

    this.cpuTime.timeStart();
  }

  _endTimers() {
    this.cpuTime.timeEnd();

    if (this._gpuTimeQuery) {
      this._gpuTimeQuery.end();
    }
  }

  _startEventHandling() {
    this.gl.canvas.addEventListener('mousemove', this._onMousemove);
    this.gl.canvas.addEventListener('mouseleave', this._onMouseleave);
  }

  _onMousemove(e) {
    this.animationProps._mousePosition = [e.offsetX, e.offsetY];
  }

  _onMouseleave(e) {
    this.animationProps._mousePosition = null;
  }

}
//# sourceMappingURL=animation-loop.js.map