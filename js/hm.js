/*
 * heatmap.js v2.0.5 | JavaScript Heatmap Library
 *
 * Copyright 2008-2016 Patrick Wied <heatmapjs@patrick-wied.at> - All rights reserved.
 * Dual licensed under MIT and Beerware license
 *
 * :: 2016-09-05 01:16
 */
;(function (name, context, factory) {

  // Supports UMD. AMD, CommonJS/Node.js and browser context
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else if (typeof define === "function" && define.amd) {
    define(factory);
  } else {
    context[name] = factory();
  }

})("h337", this, function () {

// Heatmap Config stores default values and will be merged with instance config
var HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: { 0.25: "rgb(0,0,255)", 0.55: "rgb(0,255,0)", 0.85: "yellow", 1.0: "rgb(255,0,0)"},
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: .85,
  defaultXField: 'x',
  defaultYField: 'y',
  defaultValueField: 'value',
  plugins: {}
};
var Store = (function StoreClosure() {

  var Store = function Store(config) {
    this._coordinator = {};
    this._data = [];
    this._radi = [];
    this._min = 10;
    this._max = 1;
    this._xField = config['xField'] || config.defaultXField;
    this._yField = config['yField'] || config.defaultYField;
    this._valueField = config['valueField'] || config.defaultValueField;

    if (config["radius"]) {
      this._cfgRadius = config["radius"];
    }
  };

  var defaultRadius = HeatmapConfig.defaultRadius;

  Store.prototype = {
    // when forceRender = false -> called from setData, omits renderall event
    _organiseData: function(dataPoint, forceRender) {
        var x = dataPoint[this._xField];
        var y = dataPoint[this._yField];
        var radi = this._radi;
        var store = this._data;
        var max = this._max;
        var min = this._min;
        var value = dataPoint[this._valueField] || 1;
        var radius = dataPoint.radius || this._cfgRadius || defaultRadius;

        if (!store[x]) {
          store[x] = [];
          radi[x] = [];
        }

        if (!store[x][y]) {
          store[x][y] = value;
          radi[x][y] = radius;
        } else {
          store[x][y] += value;
        }
        var storedVal = store[x][y];

        if (storedVal > max) {
          if (!forceRender) {
            this._max = storedVal;
          } else {
            this.setDataMax(storedVal);
          }
          return false;
        } else if (storedVal < min) {
          if (!forceRender) {
            this._min = storedVal;
          } else {
            this.setDataMin(storedVal);
          }
          return false;
        } else {
          return {
            x: x,
            y: y,
            value: value,
            radius: radius,
            min: min,
            max: max
          };
        }
    },
    _unOrganizeData: function() {
      var unorganizedData = [];
      var data = this._data;
      var radi = this._radi;

      for (var x in data) {
        for (var y in data[x]) {

          unorganizedData.push({
            x: x,
            y: y,
            radius: radi[x][y],
            value: data[x][y]
          });

        }
      }
      return {
        min: this._min,
        max: this._max,
        data: unorganizedData
      };
    },
    _onExtremaChange: function() {
      this._coordinator.emit('extremachange', {
        min: this._min,
        max: this._max
      });
    },
    addData: function() {
      if (arguments[0].length > 0) {
        var dataArr = arguments[0];
        var dataLen = dataArr.length;
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen]);
        }
      } else {
        // add to store
        var organisedEntry = this._organiseData(arguments[0], true);
        if (organisedEntry) {
          // if it's the first datapoint initialize the extremas with it
          if (this._data.length === 0) {
            this._min = this._max = organisedEntry.value;
          }
          this._coordinator.emit('renderpartial', {
            min: this._min,
            max: this._max,
            data: [organisedEntry]
          });
        }
      }
      return this;
    },
    setData: function(data) {
      var dataPoints = data.data;
      var pointsLen = dataPoints.length;


      // reset data arrays
      this._data = [];
      this._radi = [];

      for(var i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false);
      }
      this._max = data.max;
      this._min = data.min || 0;

      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    removeData: function() {
      // TODO: implement
    },
    setDataMax: function(max) {
      this._max = max;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setDataMin: function(min) {
      this._min = min;
      this._onExtremaChange();
      this._coordinator.emit('renderall', this._getInternalData());
      return this;
    },
    setCoordinator: function(coordinator) {
      this._coordinator = coordinator;
    },
    _getInternalData: function() {
      return {
        max: this._max,
        min: this._min,
        data: this._data,
        radi: this._radi
      };
    },
    getData: function() {
      return this._unOrganizeData();
    }/*,

      TODO: rethink.

    getValueAt: function(point) {
      var value;
      var radius = 100;
      var x = point.x;
      var y = point.y;
      var data = this._data;

      if (data[x] && data[x][y]) {
        return data[x][y];
      } else {
        var values = [];
        // radial search for datapoints based on default radius
        for(var distance = 1; distance < radius; distance++) {
          var neighbors = distance * 2 +1;
          var startX = x - distance;
          var startY = y - distance;

          for(var i = 0; i < neighbors; i++) {
            for (var o = 0; o < neighbors; o++) {
              if ((i == 0 || i == neighbors-1) || (o == 0 || o == neighbors-1)) {
                if (data[startY+i] && data[startY+i][startX+o]) {
                  values.push(data[startY+i][startX+o]);
                }
              } else {
                continue;
              }
            }
          }
        }
        if (values.length > 0) {
          return Math.max.apply(Math, values);
        }
      }
      return false;
    }*/
  };


  return Store;
})();

var Canvas2dRenderer = (function Canvas2dRendererClosure() {

  var _getColorPalette = function(config) {
    var gradientConfig = config.gradient || config.defaultGradient;
    var paletteCanvas = document.createElement('canvas');
    var paletteCtx = paletteCanvas.getContext('2d');

    paletteCanvas.width = 256;
    paletteCanvas.height = 1;

    var gradient = paletteCtx.createLinearGradient(0, 0, 256, 1);
    for (var key in gradientConfig) {
      gradient.addColorStop(key, gradientConfig[key]);
    }

    paletteCtx.fillStyle = gradient;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  };

  var _getPointTemplate = function(radius, blurFactor) {
    var tplCanvas = document.createElement('canvas');
    var tplCtx = tplCanvas.getContext('2d');
    var x = radius;
    var y = radius;
    tplCanvas.width = tplCanvas.height = radius*2;

    if (blurFactor == 1) {
      tplCtx.beginPath();
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false);
      tplCtx.fillStyle = 'rgba(0,0,0,1)';
      tplCtx.fill();
    } else {
      var gradient = tplCtx.createRadialGradient(x, y, radius*blurFactor, x, y, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      tplCtx.fillStyle = gradient;
      tplCtx.fillRect(0, 0, 2*radius, 2*radius);
    }



    return tplCanvas;
  };

  var _prepareData = function(data) {
    var renderData = [];
    var min = data.min;
    var max = data.max;
    var radi = data.radi;
    var data = data.data;

    var xValues = Object.keys(data);
    var xValuesLen = xValues.length;

    while(xValuesLen--) {
      var xValue = xValues[xValuesLen];
      var yValues = Object.keys(data[xValue]);
      var yValuesLen = yValues.length;
      while(yValuesLen--) {
        var yValue = yValues[yValuesLen];
        var value = data[xValue][yValue];
        var radius = radi[xValue][yValue];
        renderData.push({
          x: xValue,
          y: yValue,
          value: value,
          radius: radius
        });
      }
    }

    return {
      min: min,
      max: max,
      data: renderData
    };
  };


  function Canvas2dRenderer(config) {
    var container = config.container;
    var shadowCanvas = this.shadowCanvas = document.createElement('canvas');
    var canvas = this.canvas = config.canvas || document.createElement('canvas');
    var renderBoundaries = this._renderBoundaries = [10000, 10000, 0, 0];

    var computed = getComputedStyle(config.container) || {};

    canvas.className = 'heatmap-canvas';

    this._width = canvas.width = shadowCanvas.width = config.width || +(computed.width.replace(/px/,''));
    this._height = canvas.height = shadowCanvas.height = config.height || +(computed.height.replace(/px/,''));

    this.shadowCtx = shadowCanvas.getContext('2d');
    this.ctx = canvas.getContext('2d');

    // @TODO:
    // conditional wrapper

    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;';

    container.style.position = 'relative';
    container.appendChild(canvas);

    this._palette = _getColorPalette(config);
    this._templates = {};

    this._setStyles(config);
  };

  Canvas2dRenderer.prototype = {
    renderPartial: function(data) {
      if (data.data.length > 0) {
        this._drawAlpha(data);
        this._colorize();
      }
    },
    renderAll: function(data) {
      // reset render boundaries
      this._clear();
      if (data.data.length > 0) {
        this._drawAlpha(_prepareData(data));
        this._colorize();
      }
    },
    _updateGradient: function(config) {
      this._palette = _getColorPalette(config);
    },
    updateConfig: function(config) {
      if (config['gradient']) {
        this._updateGradient(config);
      }
      this._setStyles(config);
    },
    setDimensions: function(width, height) {
      this._width = width;
      this._height = height;
      this.canvas.width = this.shadowCanvas.width = width;
      this.canvas.height = this.shadowCanvas.height = height;
    },
    _clear: function() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height);
      this.ctx.clearRect(0, 0, this._width, this._height);
    },
    _setStyles: function(config) {
      this._blur = (config.blur == 0)?0:(config.blur || config.defaultBlur);

      if (config.backgroundColor) {
        this.canvas.style.backgroundColor = config.backgroundColor;
      }

      this._width = this.canvas.width = this.shadowCanvas.width = config.width || this._width;
      this._height = this.canvas.height = this.shadowCanvas.height = config.height || this._height;


      this._opacity = (config.opacity || 0) * 255;
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255;
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255;
      this._useGradientOpacity = !!config.useGradientOpacity;
    },
    _drawAlpha: function(data) {
      var min = this._min = data.min;
      var max = this._max = data.max;
      var data = data.data || [];
      var dataLen = data.length;
      // on a point basis?
      var blur = 1 - this._blur;

      while(dataLen--) {

        var point = data[dataLen];

        var x = point.x;
        var y = point.y;
        var radius = point.radius;
        // if value is bigger than max
        // use max as value
        var value = Math.min(point.value, max);
        var rectX = x - radius;
        var rectY = y - radius;
        var shadowCtx = this.shadowCtx;




        var tpl;
        if (!this._templates[radius]) {
          this._templates[radius] = tpl = _getPointTemplate(radius, blur);
        } else {
          tpl = this._templates[radius];
        }
        // value from minimum / value range
        // => [0, 1]
        var templateAlpha = (value-min)/(max-min);
        // this fixes #176: small values are not visible because globalAlpha < .01 cannot be read from imageData
        shadowCtx.globalAlpha = templateAlpha < .01 ? .01 : templateAlpha;

        shadowCtx.drawImage(tpl, rectX, rectY);

        // update renderBoundaries
        if (rectX < this._renderBoundaries[0]) {
            this._renderBoundaries[0] = rectX;
          }
          if (rectY < this._renderBoundaries[1]) {
            this._renderBoundaries[1] = rectY;
          }
          if (rectX + 2*radius > this._renderBoundaries[2]) {
            this._renderBoundaries[2] = rectX + 2*radius;
          }
          if (rectY + 2*radius > this._renderBoundaries[3]) {
            this._renderBoundaries[3] = rectY + 2*radius;
          }

      }
    },
    _colorize: function() {
      var x = this._renderBoundaries[0];
      var y = this._renderBoundaries[1];
      var width = this._renderBoundaries[2] - x;
      var height = this._renderBoundaries[3] - y;
      var maxWidth = this._width;
      var maxHeight = this._height;
      var opacity = this._opacity;
      var maxOpacity = this._maxOpacity;
      var minOpacity = this._minOpacity;
      var useGradientOpacity = this._useGradientOpacity;

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }
      if (x + width > maxWidth) {
        width = maxWidth - x;
      }
      if (y + height > maxHeight) {
        height = maxHeight - y;
      }

      var img = this.shadowCtx.getImageData(x, y, width, height);
      var imgData = img.data;
      var len = imgData.length;
      var palette = this._palette;


      for (var i = 3; i < len; i+= 4) {
        var alpha = imgData[i];
        var offset = alpha * 4;


        if (!offset) {
          continue;
        }

        var finalAlpha;
        if (opacity > 0) {
          finalAlpha = opacity;
        } else {
          if (alpha < maxOpacity) {
            if (alpha < minOpacity) {
              finalAlpha = minOpacity;
            } else {
              finalAlpha = alpha;
            }
          } else {
            finalAlpha = maxOpacity;
          }
        }

        imgData[i-3] = palette[offset];
        imgData[i-2] = palette[offset + 1];
        imgData[i-1] = palette[offset + 2];
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha;

      }

      img.data = imgData;
      this.ctx.putImageData(img, x, y);

      this._renderBoundaries = [1000, 1000, 0, 0];

    },
    getValueAt: function(point) {
      var value;
      var shadowCtx = this.shadowCtx;
      var img = shadowCtx.getImageData(point.x, point.y, 1, 1);
      var data = img.data[3];
      var max = this._max;
      var min = this._min;

      value = (Math.abs(max-min) * (data/255)) >> 0;

      return value;
    },
    getDataURL: function() {
      return this.canvas.toDataURL();
    }
  };


  return Canvas2dRenderer;
})();


var Renderer = (function RendererClosure() {

  var rendererFn = false;

  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') {
    rendererFn = Canvas2dRenderer;
  }

  return rendererFn;
})();


var Util = {
  merge: function() {
    var merged = {};
    var argsLen = arguments.length;
    for (var i = 0; i < argsLen; i++) {
      var obj = arguments[i]
      for (var key in obj) {
        merged[key] = obj[key];
      }
    }
    return merged;
  }
};
// Heatmap Constructor
var Heatmap = (function HeatmapClosure() {

  var Coordinator = (function CoordinatorClosure() {

    function Coordinator() {
      this.cStore = {};
    };

    Coordinator.prototype = {
      on: function(evtName, callback, scope) {
        var cStore = this.cStore;

        if (!cStore[evtName]) {
          cStore[evtName] = [];
        }
        cStore[evtName].push((function(data) {
            return callback.call(scope, data);
        }));
      },
      emit: function(evtName, data) {
        var cStore = this.cStore;
        if (cStore[evtName]) {
          var len = cStore[evtName].length;
          for (var i=0; i<len; i++) {
            var callback = cStore[evtName][i];
            callback(data);
          }
        }
      }
    };

    return Coordinator;
  })();


  var _connect = function(scope) {
    var renderer = scope._renderer;
    var coordinator = scope._coordinator;
    var store = scope._store;

    coordinator.on('renderpartial', renderer.renderPartial, renderer);
    coordinator.on('renderall', renderer.renderAll, renderer);
    coordinator.on('extremachange', function(data) {
      scope._config.onExtremaChange &&
      scope._config.onExtremaChange({
        min: data.min,
        max: data.max,
        gradient: scope._config['gradient'] || scope._config['defaultGradient']
      });
    });
    store.setCoordinator(coordinator);
  };


  function Heatmap() {
    var config = this._config = Util.merge(HeatmapConfig, arguments[0] || {});
    this._coordinator = new Coordinator();
    if (config['plugin']) {
      var pluginToLoad = config['plugin'];
      if (!HeatmapConfig.plugins[pluginToLoad]) {
        throw new Error('Plugin \''+ pluginToLoad + '\' not found. Maybe it was not registered.');
      } else {
        var plugin = HeatmapConfig.plugins[pluginToLoad];
        // set plugin renderer and store
        this._renderer = new plugin.renderer(config);
        this._store = new plugin.store(config);
      }
    } else {
      this._renderer = new Renderer(config);
      this._store = new Store(config);
    }
    _connect(this);
  };

  // @TODO:
  // add API documentation
  Heatmap.prototype = {
    addData: function() {
      this._store.addData.apply(this._store, arguments);
      return this;
    },
    removeData: function() {
      this._store.removeData && this._store.removeData.apply(this._store, arguments);
      return this;
    },
    setData: function() {
      this._store.setData.apply(this._store, arguments);
      return this;
    },
    setDataMax: function() {
      this._store.setDataMax.apply(this._store, arguments);
      return this;
    },
    setDataMin: function() {
      this._store.setDataMin.apply(this._store, arguments);
      return this;
    },
    configure: function(config) {
      this._config = Util.merge(this._config, config);
      this._renderer.updateConfig(this._config);
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    repaint: function() {
      this._coordinator.emit('renderall', this._store._getInternalData());
      return this;
    },
    getData: function() {
      return this._store.getData();
    },
    getDataURL: function() {
      return this._renderer.getDataURL();
    },
    getValueAt: function(point) {

      if (this._store.getValueAt) {
        return this._store.getValueAt(point);
      } else  if (this._renderer.getValueAt) {
        return this._renderer.getValueAt(point);
      } else {
        return null;
      }
    }
  };

  return Heatmap;

})();


// core
var heatmapFactory = {
  create: function(config) {
    return new Heatmap(config);
  },
  register: function(pluginKey, plugin) {
    HeatmapConfig.plugins[pluginKey] = plugin;
  }
};

return heatmapFactory;


});

/*
=================================
img-touch-canvas - v0.1
http://github.com/rombdn/img-touch-canvas

(c) 2013 Romain BEAUDON
This code may be freely distributed under the MIT License
=================================
*/


(function() {
    var root = this; //global object

    var ImgTouchCanvas = function(options) {
        if( !options || !options.canvas || !options.path) {
            throw 'ImgZoom constructor: missing arguments canvas or path';
        }

        this.canvas         = options.canvas;
        this.canvas.width   = this.canvas.clientWidth;
        this.canvas.height  = this.canvas.clientHeight;
        this.context        = this.canvas.getContext('2d');

        this.desktop = options.desktop || false; //non touch events

        this.position = {
            x: 0,
            y: 0
        };
        this.scale = {
            x: 0.5,
            y: 0.5
        };
        this.imgTexture = new Image();
        this.imgTexture.src = options.path;

        this.lastZoomScale = null;
        this.lastX = null;
        this.lastY = null;

        this.mdown = false; //desktop drag

        this.init = false;
        this.checkRequestAnimationFrame();
        requestAnimationFrame(this.animate.bind(this));

        this.setEventListeners();
    };


    ImgTouchCanvas.prototype = {
        animate: function() {
            //set scale such as image cover all the canvas
            if(!this.init) {
                if(this.imgTexture.width) {
                    var scaleRatio = null;
                    if(this.canvas.clientWidth > this.canvas.clientHeight) {
                        scaleRatio = this.canvas.clientWidth / this.imgTexture.width;
                    }
                    else {
                        scaleRatio = this.canvas.clientHeight / this.imgTexture.height;
                    }

                    this.scale.x = scaleRatio;
                    this.scale.y = scaleRatio;
                    this.init = true;
                }
            }

            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.context.drawImage(
                this.imgTexture,
                this.position.x, this.position.y,
                this.scale.x * this.imgTexture.width,
                this.scale.y * this.imgTexture.height);

            requestAnimationFrame(this.animate.bind(this));
        },


        gesturePinchZoom: function(event) {
            var zoom = false;

            if( event.targetTouches.length >= 2 ) {
                var p1 = event.targetTouches[0];
                var p2 = event.targetTouches[1];
                var zoomScale = Math.sqrt(Math.pow(p2.pageX - p1.pageX, 2) + Math.pow(p2.pageY - p1.pageY, 2)); //euclidian distance

                if( this.lastZoomScale ) {
                    zoom = zoomScale - this.lastZoomScale;
                }

                this.lastZoomScale = zoomScale;
            }

            return zoom;
        },

        doZoom: function(zoom) {
            if(!zoom) return;

            //new scale
            var currentScale = this.scale.x;
            var newScale = this.scale.x + zoom/100;


            //some helpers
            var deltaScale = newScale - currentScale;
            var currentWidth    = (this.imgTexture.width * this.scale.x);
            var currentHeight   = (this.imgTexture.height * this.scale.y);
            var deltaWidth  = this.imgTexture.width*deltaScale;
            var deltaHeight = this.imgTexture.height*deltaScale;


            //by default scale doesnt change position and only add/remove pixel to right and bottom
            //so we must move the image to the left to keep the image centered
            //ex: coefX and coefY = 0.5 when image is centered <=> move image to the left 0.5x pixels added to the right
            var canvasmiddleX = this.canvas.clientWidth / 2;
            var canvasmiddleY = this.canvas.clientHeight / 2;
            var xonmap = (-this.position.x) + canvasmiddleX;
            var yonmap = (-this.position.y) + canvasmiddleY;
            var coefX = -xonmap / (currentWidth);
            var coefY = -yonmap / (currentHeight);
            var newPosX = this.position.x + deltaWidth*coefX;
            var newPosY = this.position.y + deltaHeight*coefY;

            //edges cases
            var newWidth = currentWidth + deltaWidth;
            var newHeight = currentHeight + deltaHeight;

            if( newWidth < this.canvas.clientWidth ) return;
            if( newPosX > 0 ) { newPosX = 0; }
            if( newPosX + newWidth < this.canvas.clientWidth ) { newPosX = this.canvas.clientWidth - newWidth;}

            if( newHeight < this.canvas.clientHeight ) return;
            if( newPosY > 0 ) { newPosY = 0; }
            if( newPosY + newHeight < this.canvas.clientHeight ) { newPosY = this.canvas.clientHeight - newHeight; }


            //finally affectations
            this.scale.x    = newScale;
            this.scale.y    = newScale;
            this.position.x = newPosX;
            this.position.y = newPosY;
        },

        doMove: function(relativeX, relativeY) {
            if(this.lastX && this.lastY) {
              var deltaX = relativeX - this.lastX;
              var deltaY = relativeY - this.lastY;
              var currentWidth = (this.imgTexture.width * this.scale.x);
              var currentHeight = (this.imgTexture.height * this.scale.y);

              this.position.x += deltaX;
              this.position.y += deltaY;


              //edge cases
              if( this.position.x > 0 ) {
                this.position.x = 0;
              }
              else if( this.position.x + currentWidth < this.canvas.clientWidth ) {
                this.position.x = this.canvas.clientWidth - currentWidth;
              }
              if( this.position.y > 0 ) {
                this.position.y = 0;
              }
              else if( this.position.y + currentHeight < this.canvas.clientHeight ) {
                this.position.y = this.canvas.clientHeight - currentHeight;
              }
            }

            this.lastX = relativeX;
            this.lastY = relativeY;
        },

        setEventListeners: function() {
            // touch
            this.canvas.addEventListener('touchstart', function(e) {
                this.lastX          = null;
                this.lastY          = null;
                this.lastZoomScale  = null;
            }.bind(this));

            this.canvas.addEventListener('touchmove', function(e) {
                e.preventDefault();

                if(e.targetTouches.length == 2) { //pinch
                    this.doZoom(this.gesturePinchZoom(e));
                }
                else if(e.targetTouches.length == 1) {
                    var relativeX = e.targetTouches[0].pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.targetTouches[0].pageY - this.canvas.getBoundingClientRect().top;
                    this.doMove(relativeX, relativeY);
                }
            }.bind(this));

            if(this.desktop) {
                // keyboard+mouse
                window.addEventListener('keyup', function(e) {
                    if(e.keyCode == 187 || e.keyCode == 61) { //+
                        this.doZoom(5);
                    }
                    else if(e.keyCode == 54) {//-
                        this.doZoom(-5);
                    }
                }.bind(this));

                window.addEventListener('mousedown', function(e) {
                    this.mdown = true;
                    this.lastX = null;
                    this.lastY = null;
                }.bind(this));

                window.addEventListener('mouseup', function(e) {
                    this.mdown = false;
                }.bind(this));

                window.addEventListener('mousemove', function(e) {
                    var relativeX = e.pageX - this.canvas.getBoundingClientRect().left;
                    var relativeY = e.pageY - this.canvas.getBoundingClientRect().top;

                    if(e.target == this.canvas && this.mdown) {
                        this.doMove(relativeX, relativeY);
                    }

                    if(relativeX <= 0 || relativeX >= this.canvas.clientWidth || relativeY <= 0 || relativeY >= this.canvas.clientHeight) {
                        this.mdown = false;
                    }
                }.bind(this));
            }
        },

        checkRequestAnimationFrame: function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                window.cancelAnimationFrame =
                  window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                window.requestAnimationFrame = function(callback, element) {
                    var currTime = new Date().getTime();
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }

            if (!window.cancelAnimationFrame) {
                window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
        }
    };

    root.ImgTouchCanvas = ImgTouchCanvas;
}).call(this);




// svg-pan-zoom v3.4.0
// https://github.com/ariutta/svg-pan-zoom
!function t(e,o,n){function i(r,a){if(!o[r]){if(!e[r]){var l="function"==typeof require&&require;if(!a&&l)return l(r,!0);if(s)return s(r,!0);var u=new Error("Cannot find module '"+r+"'");throw u.code="MODULE_NOT_FOUND",u}var h=o[r]={exports:{}};e[r][0].call(h.exports,function(t){var o=e[r][1][t];return i(o?o:t)},h,h.exports,t,e,o,n)}return o[r].exports}for(var s="function"==typeof require&&require,r=0;r<n.length;r++)i(n[r]);return i}({1:[function(t,e,o){var n=t("./svg-pan-zoom.js");!function(t,o){"function"==typeof define&&define.amd?define("svg-pan-zoom",function(){return n}):"undefined"!=typeof e&&e.exports&&(e.exports=n,t.svgPanZoom=n)}(window,document)},{"./svg-pan-zoom.js":4}],2:[function(t,e,o){var n=t("./svg-utilities");e.exports={enable:function(t){var e=t.svg.querySelector("defs");e||(e=document.createElementNS(n.svgNS,"defs"),t.svg.appendChild(e));var o=e.querySelector("style#svg-pan-zoom-controls-styles");if(!o){var i=document.createElementNS(n.svgNS,"style");i.setAttribute("id","svg-pan-zoom-controls-styles"),i.setAttribute("type","text/css"),i.textContent=".svg-pan-zoom-control { cursor: pointer; fill: black; fill-opacity: 0.333; } .svg-pan-zoom-control:hover { fill-opacity: 0.8; } .svg-pan-zoom-control-background { fill: white; fill-opacity: 0.5; } .svg-pan-zoom-control-background { fill-opacity: 0.8; }",e.appendChild(i)}var s=document.createElementNS(n.svgNS,"g");s.setAttribute("id","svg-pan-zoom-controls"),s.setAttribute("transform","translate("+(t.width-70)+" "+(t.height-76)+") scale(0.75)"),s.setAttribute("class","svg-pan-zoom-control"),s.appendChild(this._createZoomIn(t)),s.appendChild(this._createZoomReset(t)),s.appendChild(this._createZoomOut(t)),t.svg.appendChild(s),t.controlIcons=s},_createZoomIn:function(t){var e=document.createElementNS(n.svgNS,"g");e.setAttribute("id","svg-pan-zoom-zoom-in"),e.setAttribute("transform","translate(30.5 5) scale(0.015)"),e.setAttribute("class","svg-pan-zoom-control"),e.addEventListener("click",function(){t.getPublicInstance().zoomIn()},!1),e.addEventListener("touchstart",function(){t.getPublicInstance().zoomIn()},!1);var o=document.createElementNS(n.svgNS,"rect");o.setAttribute("x","0"),o.setAttribute("y","0"),o.setAttribute("width","1500"),o.setAttribute("height","1400"),o.setAttribute("class","svg-pan-zoom-control-background"),e.appendChild(o);var i=document.createElementNS(n.svgNS,"path");return i.setAttribute("d","M1280 576v128q0 26 -19 45t-45 19h-320v320q0 26 -19 45t-45 19h-128q-26 0 -45 -19t-19 -45v-320h-320q-26 0 -45 -19t-19 -45v-128q0 -26 19 -45t45 -19h320v-320q0 -26 19 -45t45 -19h128q26 0 45 19t19 45v320h320q26 0 45 19t19 45zM1536 1120v-960 q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5t84.5 -203.5z"),i.setAttribute("class","svg-pan-zoom-control-element"),e.appendChild(i),e},_createZoomReset:function(t){var e=document.createElementNS(n.svgNS,"g");e.setAttribute("id","svg-pan-zoom-reset-pan-zoom"),e.setAttribute("transform","translate(5 35) scale(0.4)"),e.setAttribute("class","svg-pan-zoom-control"),e.addEventListener("click",function(){t.getPublicInstance().reset()},!1),e.addEventListener("touchstart",function(){t.getPublicInstance().reset()},!1);var o=document.createElementNS(n.svgNS,"rect");o.setAttribute("x","2"),o.setAttribute("y","2"),o.setAttribute("width","182"),o.setAttribute("height","58"),o.setAttribute("class","svg-pan-zoom-control-background"),e.appendChild(o);var i=document.createElementNS(n.svgNS,"path");i.setAttribute("d","M33.051,20.632c-0.742-0.406-1.854-0.609-3.338-0.609h-7.969v9.281h7.769c1.543,0,2.701-0.188,3.473-0.562c1.365-0.656,2.048-1.953,2.048-3.891C35.032,22.757,34.372,21.351,33.051,20.632z"),i.setAttribute("class","svg-pan-zoom-control-element"),e.appendChild(i);var s=document.createElementNS(n.svgNS,"path");return s.setAttribute("d","M170.231,0.5H15.847C7.102,0.5,0.5,5.708,0.5,11.84v38.861C0.5,56.833,7.102,61.5,15.847,61.5h154.384c8.745,0,15.269-4.667,15.269-10.798V11.84C185.5,5.708,178.976,0.5,170.231,0.5z M42.837,48.569h-7.969c-0.219-0.766-0.375-1.383-0.469-1.852c-0.188-0.969-0.289-1.961-0.305-2.977l-0.047-3.211c-0.03-2.203-0.41-3.672-1.142-4.406c-0.732-0.734-2.103-1.102-4.113-1.102h-7.05v13.547h-7.055V14.022h16.524c2.361,0.047,4.178,0.344,5.45,0.891c1.272,0.547,2.351,1.352,3.234,2.414c0.731,0.875,1.31,1.844,1.737,2.906s0.64,2.273,0.64,3.633c0,1.641-0.414,3.254-1.242,4.84s-2.195,2.707-4.102,3.363c1.594,0.641,2.723,1.551,3.387,2.73s0.996,2.98,0.996,5.402v2.32c0,1.578,0.063,2.648,0.19,3.211c0.19,0.891,0.635,1.547,1.333,1.969V48.569z M75.579,48.569h-26.18V14.022h25.336v6.117H56.454v7.336h16.781v6H56.454v8.883h19.125V48.569z M104.497,46.331c-2.44,2.086-5.887,3.129-10.34,3.129c-4.548,0-8.125-1.027-10.731-3.082s-3.909-4.879-3.909-8.473h6.891c0.224,1.578,0.662,2.758,1.316,3.539c1.196,1.422,3.246,2.133,6.15,2.133c1.739,0,3.151-0.188,4.236-0.562c2.058-0.719,3.087-2.055,3.087-4.008c0-1.141-0.504-2.023-1.512-2.648c-1.008-0.609-2.607-1.148-4.796-1.617l-3.74-0.82c-3.676-0.812-6.201-1.695-7.576-2.648c-2.328-1.594-3.492-4.086-3.492-7.477c0-3.094,1.139-5.664,3.417-7.711s5.623-3.07,10.036-3.07c3.685,0,6.829,0.965,9.431,2.895c2.602,1.93,3.966,4.73,4.093,8.402h-6.938c-0.128-2.078-1.057-3.555-2.787-4.43c-1.154-0.578-2.587-0.867-4.301-0.867c-1.907,0-3.428,0.375-4.565,1.125c-1.138,0.75-1.706,1.797-1.706,3.141c0,1.234,0.561,2.156,1.682,2.766c0.721,0.406,2.25,0.883,4.589,1.43l6.063,1.43c2.657,0.625,4.648,1.461,5.975,2.508c2.059,1.625,3.089,3.977,3.089,7.055C108.157,41.624,106.937,44.245,104.497,46.331z M139.61,48.569h-26.18V14.022h25.336v6.117h-18.281v7.336h16.781v6h-16.781v8.883h19.125V48.569z M170.337,20.14h-10.336v28.43h-7.266V20.14h-10.383v-6.117h27.984V20.14z"),s.setAttribute("class","svg-pan-zoom-control-element"),e.appendChild(s),e},_createZoomOut:function(t){var e=document.createElementNS(n.svgNS,"g");e.setAttribute("id","svg-pan-zoom-zoom-out"),e.setAttribute("transform","translate(30.5 70) scale(0.015)"),e.setAttribute("class","svg-pan-zoom-control"),e.addEventListener("click",function(){t.getPublicInstance().zoomOut()},!1),e.addEventListener("touchstart",function(){t.getPublicInstance().zoomOut()},!1);var o=document.createElementNS(n.svgNS,"rect");o.setAttribute("x","0"),o.setAttribute("y","0"),o.setAttribute("width","1500"),o.setAttribute("height","1400"),o.setAttribute("class","svg-pan-zoom-control-background"),e.appendChild(o);var i=document.createElementNS(n.svgNS,"path");return i.setAttribute("d","M1280 576v128q0 26 -19 45t-45 19h-896q-26 0 -45 -19t-19 -45v-128q0 -26 19 -45t45 -19h896q26 0 45 19t19 45zM1536 1120v-960q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5 t84.5 -203.5z"),i.setAttribute("class","svg-pan-zoom-control-element"),e.appendChild(i),e},disable:function(t){t.controlIcons&&(t.controlIcons.parentNode.removeChild(t.controlIcons),t.controlIcons=null)}}},{"./svg-utilities":5}],3:[function(t,e,o){var n=t("./svg-utilities"),i=t("./utilities"),s=function(t,e){this.init(t,e)};s.prototype.init=function(t,e){this.viewport=t,this.options=e,this.originalState={zoom:1,x:0,y:0},this.activeState={zoom:1,x:0,y:0},this.updateCTMCached=i.proxy(this.updateCTM,this),this.requestAnimationFrame=i.createRequestAnimationFrame(this.options.refreshRate),this.viewBox={x:0,y:0,width:0,height:0},this.cacheViewBox();var o=this.processCTM();this.setCTM(o),this.updateCTM()},s.prototype.cacheViewBox=function(){var t=this.options.svg.getAttribute("viewBox");if(t){var e=t.split(/[\s\,]/).filter(function(t){return t}).map(parseFloat);this.viewBox.x=e[0],this.viewBox.y=e[1],this.viewBox.width=e[2],this.viewBox.height=e[3];var o=Math.min(this.options.width/this.viewBox.width,this.options.height/this.viewBox.height);this.activeState.zoom=o,this.activeState.x=(this.options.width-this.viewBox.width*o)/2,this.activeState.y=(this.options.height-this.viewBox.height*o)/2,this.updateCTMOnNextFrame(),this.options.svg.removeAttribute("viewBox")}else this.simpleViewBoxCache()},s.prototype.simpleViewBoxCache=function(){var t=this.viewport.getBBox();this.viewBox.x=t.x,this.viewBox.y=t.y,this.viewBox.width=t.width,this.viewBox.height=t.height},s.prototype.getViewBox=function(){return i.extend({},this.viewBox)},s.prototype.processCTM=function(){var t=this.getCTM();if(this.options.fit||this.options.contain){var e;e=this.options.fit?Math.min(this.options.width/this.viewBox.width,this.options.height/this.viewBox.height):Math.max(this.options.width/this.viewBox.width,this.options.height/this.viewBox.height),t.a=e,t.d=e,t.e=-this.viewBox.x*e,t.f=-this.viewBox.y*e}if(this.options.center){var o=.5*(this.options.width-(this.viewBox.width+2*this.viewBox.x)*t.a),n=.5*(this.options.height-(this.viewBox.height+2*this.viewBox.y)*t.a);t.e=o,t.f=n}return this.originalState.zoom=t.a,this.originalState.x=t.e,this.originalState.y=t.f,t},s.prototype.getOriginalState=function(){return i.extend({},this.originalState)},s.prototype.getState=function(){return i.extend({},this.activeState)},s.prototype.getZoom=function(){return this.activeState.zoom},s.prototype.getRelativeZoom=function(){return this.activeState.zoom/this.originalState.zoom},s.prototype.computeRelativeZoom=function(t){return t/this.originalState.zoom},s.prototype.getPan=function(){return{x:this.activeState.x,y:this.activeState.y}},s.prototype.getCTM=function(){var t=this.options.svg.createSVGMatrix();return t.a=this.activeState.zoom,t.b=0,t.c=0,t.d=this.activeState.zoom,t.e=this.activeState.x,t.f=this.activeState.y,t},s.prototype.setCTM=function(t){var e=this.isZoomDifferent(t),o=this.isPanDifferent(t);if(e||o){if(e&&this.options.beforeZoom(this.getRelativeZoom(),this.computeRelativeZoom(t.a))===!1&&(t.a=t.d=this.activeState.zoom,e=!1),o){var n=this.options.beforePan(this.getPan(),{x:t.e,y:t.f}),s=!1,r=!1;n===!1?(t.e=this.getPan().x,t.f=this.getPan().y,s=r=!0):i.isObject(n)&&(n.x===!1?(t.e=this.getPan().x,s=!0):i.isNumber(n.x)&&(t.e=n.x),n.y===!1?(t.f=this.getPan().y,r=!0):i.isNumber(n.y)&&(t.f=n.y)),s&&r&&(o=!1)}(e||o)&&(this.updateCache(t),this.updateCTMOnNextFrame(),e&&this.options.onZoom(this.getRelativeZoom()),o&&this.options.onPan(this.getPan()))}},s.prototype.isZoomDifferent=function(t){return this.activeState.zoom!==t.a},s.prototype.isPanDifferent=function(t){return this.activeState.x!==t.e||this.activeState.y!==t.f},s.prototype.updateCache=function(t){this.activeState.zoom=t.a,this.activeState.x=t.e,this.activeState.y=t.f},s.prototype.pendingUpdate=!1,s.prototype.updateCTMOnNextFrame=function(){this.pendingUpdate||(this.pendingUpdate=!0,this.requestAnimationFrame.call(window,this.updateCTMCached))},s.prototype.updateCTM=function(){n.setCTM(this.viewport,this.getCTM(),this.defs),this.pendingUpdate=!1},e.exports=function(t,e){return new s(t,e)}},{"./svg-utilities":5,"./utilities":7}],4:[function(t,e,o){var n=t("./uniwheel"),i=t("./control-icons"),s=t("./utilities"),r=t("./svg-utilities"),a=t("./shadow-viewport"),l=function(t,e){this.init(t,e)},u={viewportSelector:".svg-pan-zoom_viewport",panEnabled:!0,controlIconsEnabled:!1,zoomEnabled:!0,dblClickZoomEnabled:!0,mouseWheelZoomEnabled:!0,preventMouseEventsDefault:!0,zoomScaleSensitivity:.1,minZoom:.5,maxZoom:10,fit:!0,contain:!1,center:!0,refreshRate:"auto",beforeZoom:null,onZoom:null,beforePan:null,onPan:null,customEventsHandler:null,eventsListenerElement:null};l.prototype.init=function(t,e){var o=this;this.svg=t,this.defs=t.querySelector("defs"),r.setupSvgAttributes(this.svg),this.options=s.extend(s.extend({},u),e),this.state="none";var n=r.getBoundingClientRectNormalized(t);this.width=n.width,this.height=n.height,this.viewport=a(r.getOrCreateViewport(this.svg,this.options.viewportSelector),{svg:this.svg,width:this.width,height:this.height,fit:this.options.fit,contain:this.options.contain,center:this.options.center,refreshRate:this.options.refreshRate,beforeZoom:function(t,e){return o.viewport&&o.options.beforeZoom?o.options.beforeZoom(t,e):void 0},onZoom:function(t){return o.viewport&&o.options.onZoom?o.options.onZoom(t):void 0},beforePan:function(t,e){return o.viewport&&o.options.beforePan?o.options.beforePan(t,e):void 0},onPan:function(t){return o.viewport&&o.options.onPan?o.options.onPan(t):void 0}});var l=this.getPublicInstance();l.setBeforeZoom(this.options.beforeZoom),l.setOnZoom(this.options.onZoom),l.setBeforePan(this.options.beforePan),l.setOnPan(this.options.onPan),this.options.controlIconsEnabled&&i.enable(this),this.lastMouseWheelEventTime=Date.now(),this.setupHandlers()},l.prototype.setupHandlers=function(){var t=this,e=null;if(this.eventListeners={mousedown:function(o){var n=t.handleMouseDown(o,e);return e=o,n},touchstart:function(o){var n=t.handleMouseDown(o,e);return e=o,n},mouseup:function(e){return t.handleMouseUp(e)},touchend:function(e){return t.handleMouseUp(e)},mousemove:function(e){return t.handleMouseMove(e)},touchmove:function(e){return t.handleMouseMove(e)},mouseleave:function(e){return t.handleMouseUp(e)},touchleave:function(e){return t.handleMouseUp(e)},touchcancel:function(e){return t.handleMouseUp(e)}},null!=this.options.customEventsHandler){this.options.customEventsHandler.init({svgElement:this.svg,eventsListenerElement:this.options.eventsListenerElement,instance:this.getPublicInstance()});var o=this.options.customEventsHandler.haltEventListeners;if(o&&o.length)for(var n=o.length-1;n>=0;n--)this.eventListeners.hasOwnProperty(o[n])&&delete this.eventListeners[o[n]]}for(var i in this.eventListeners)(this.options.eventsListenerElement||this.svg).addEventListener(i,this.eventListeners[i],!1);this.options.mouseWheelZoomEnabled&&(this.options.mouseWheelZoomEnabled=!1,this.enableMouseWheelZoom())},l.prototype.enableMouseWheelZoom=function(){if(!this.options.mouseWheelZoomEnabled){var t=this;this.wheelListener=function(e){return t.handleMouseWheel(e)},n.on(this.options.eventsListenerElement||this.svg,this.wheelListener,!1),this.options.mouseWheelZoomEnabled=!0}},l.prototype.disableMouseWheelZoom=function(){this.options.mouseWheelZoomEnabled&&(n.off(this.options.eventsListenerElement||this.svg,this.wheelListener,!1),this.options.mouseWheelZoomEnabled=!1)},l.prototype.handleMouseWheel=function(t){if(this.options.zoomEnabled&&"none"===this.state){this.options.preventMouseEventsDefault&&(t.preventDefault?t.preventDefault():t.returnValue=!1);var e=t.deltaY||1,o=Date.now()-this.lastMouseWheelEventTime,n=3+Math.max(0,30-o);this.lastMouseWheelEventTime=Date.now(),"deltaMode"in t&&0===t.deltaMode&&t.wheelDelta&&(e=0===t.deltaY?0:Math.abs(t.wheelDelta)/t.deltaY),e=e>-.3&&.3>e?e:(e>0?1:-1)*Math.log(Math.abs(e)+10)/n;var i=this.svg.getScreenCTM().inverse(),s=r.getEventPoint(t,this.svg).matrixTransform(i),a=Math.pow(1+this.options.zoomScaleSensitivity,-1*e);this.zoomAtPoint(a,s)}},l.prototype.zoomAtPoint=function(t,e,o){var n=this.viewport.getOriginalState();o?(t=Math.max(this.options.minZoom*n.zoom,Math.min(this.options.maxZoom*n.zoom,t)),t/=this.getZoom()):this.getZoom()*t<this.options.minZoom*n.zoom?t=this.options.minZoom*n.zoom/this.getZoom():this.getZoom()*t>this.options.maxZoom*n.zoom&&(t=this.options.maxZoom*n.zoom/this.getZoom());var i=this.viewport.getCTM(),s=e.matrixTransform(i.inverse()),r=this.svg.createSVGMatrix().translate(s.x,s.y).scale(t).translate(-s.x,-s.y),a=i.multiply(r);a.a!==i.a&&this.viewport.setCTM(a)},l.prototype.zoom=function(t,e){this.zoomAtPoint(t,r.getSvgCenterPoint(this.svg,this.width,this.height),e)},l.prototype.publicZoom=function(t,e){e&&(t=this.computeFromRelativeZoom(t)),this.zoom(t,e)},l.prototype.publicZoomAtPoint=function(t,e,o){if(o&&(t=this.computeFromRelativeZoom(t)),"SVGPoint"!==s.getType(e)){if(!("x"in e&&"y"in e))throw new Error("Given point is invalid");e=r.createSVGPoint(this.svg,e.x,e.y)}this.zoomAtPoint(t,e,o)},l.prototype.getZoom=function(){return this.viewport.getZoom()},l.prototype.getRelativeZoom=function(){return this.viewport.getRelativeZoom()},l.prototype.computeFromRelativeZoom=function(t){return t*this.viewport.getOriginalState().zoom},l.prototype.resetZoom=function(){var t=this.viewport.getOriginalState();this.zoom(t.zoom,!0)},l.prototype.resetPan=function(){this.pan(this.viewport.getOriginalState())},l.prototype.reset=function(){this.resetZoom(),this.resetPan()},l.prototype.handleDblClick=function(t){if(this.options.preventMouseEventsDefault&&(t.preventDefault?t.preventDefault():t.returnValue=!1),this.options.controlIconsEnabled){var e=t.target.getAttribute("class")||"";if(e.indexOf("svg-pan-zoom-control")>-1)return!1}var o;o=t.shiftKey?1/(2*(1+this.options.zoomScaleSensitivity)):2*(1+this.options.zoomScaleSensitivity);var n=r.getEventPoint(t,this.svg).matrixTransform(this.svg.getScreenCTM().inverse());this.zoomAtPoint(o,n)},l.prototype.handleMouseDown=function(t,e){this.options.preventMouseEventsDefault&&(t.preventDefault?t.preventDefault():t.returnValue=!1),s.mouseAndTouchNormalize(t,this.svg),this.options.dblClickZoomEnabled&&s.isDblClick(t,e)?this.handleDblClick(t):(this.state="pan",this.firstEventCTM=this.viewport.getCTM(),this.stateOrigin=r.getEventPoint(t,this.svg).matrixTransform(this.firstEventCTM.inverse()))},l.prototype.handleMouseMove=function(t){if(this.options.preventMouseEventsDefault&&(t.preventDefault?t.preventDefault():t.returnValue=!1),"pan"===this.state&&this.options.panEnabled){var e=r.getEventPoint(t,this.svg).matrixTransform(this.firstEventCTM.inverse()),o=this.firstEventCTM.translate(e.x-this.stateOrigin.x,e.y-this.stateOrigin.y);this.viewport.setCTM(o)}},l.prototype.handleMouseUp=function(t){this.options.preventMouseEventsDefault&&(t.preventDefault?t.preventDefault():t.returnValue=!1),"pan"===this.state&&(this.state="none")},l.prototype.fit=function(){var t=this.viewport.getViewBox(),e=Math.min(this.width/t.width,this.height/t.height);this.zoom(e,!0)},l.prototype.contain=function(){var t=this.viewport.getViewBox(),e=Math.max(this.width/t.width,this.height/t.height);this.zoom(e,!0)},l.prototype.center=function(){var t=this.viewport.getViewBox(),e=.5*(this.width-(t.width+2*t.x)*this.getZoom()),o=.5*(this.height-(t.height+2*t.y)*this.getZoom());this.getPublicInstance().pan({x:e,y:o})},l.prototype.updateBBox=function(){this.viewport.simpleViewBoxCache()},l.prototype.pan=function(t){var e=this.viewport.getCTM();e.e=t.x,e.f=t.y,this.viewport.setCTM(e)},l.prototype.panBy=function(t){var e=this.viewport.getCTM();e.e+=t.x,e.f+=t.y,this.viewport.setCTM(e)},l.prototype.getPan=function(){var t=this.viewport.getState();return{x:t.x,y:t.y}},l.prototype.resize=function(){var t=r.getBoundingClientRectNormalized(this.svg);this.width=t.width,this.height=t.height;var e=this.viewport;e.options.width=this.width,e.options.height=this.height,e.processCTM(),this.options.controlIconsEnabled&&(this.getPublicInstance().disableControlIcons(),this.getPublicInstance().enableControlIcons())},l.prototype.destroy=function(){var t=this;this.beforeZoom=null,this.onZoom=null,this.beforePan=null,this.onPan=null,null!=this.options.customEventsHandler&&this.options.customEventsHandler.destroy({svgElement:this.svg,eventsListenerElement:this.options.eventsListenerElement,instance:this.getPublicInstance()});for(var e in this.eventListeners)(this.options.eventsListenerElement||this.svg).removeEventListener(e,this.eventListeners[e],!1);this.disableMouseWheelZoom(),this.getPublicInstance().disableControlIcons(),this.reset(),h=h.filter(function(e){return e.svg!==t.svg}),delete this.options,delete this.publicInstance,delete this.pi,this.getPublicInstance=function(){return null}},l.prototype.getPublicInstance=function(){var t=this;return this.publicInstance||(this.publicInstance=this.pi={enablePan:function(){return t.options.panEnabled=!0,t.pi},disablePan:function(){return t.options.panEnabled=!1,t.pi},isPanEnabled:function(){return!!t.options.panEnabled},pan:function(e){return t.pan(e),t.pi},panBy:function(e){return t.panBy(e),t.pi},getPan:function(){return t.getPan()},setBeforePan:function(e){return t.options.beforePan=null===e?null:s.proxy(e,t.publicInstance),t.pi},setOnPan:function(e){return t.options.onPan=null===e?null:s.proxy(e,t.publicInstance),t.pi},enableZoom:function(){return t.options.zoomEnabled=!0,t.pi},disableZoom:function(){return t.options.zoomEnabled=!1,t.pi},isZoomEnabled:function(){return!!t.options.zoomEnabled},enableControlIcons:function(){return t.options.controlIconsEnabled||(t.options.controlIconsEnabled=!0,i.enable(t)),t.pi},disableControlIcons:function(){return t.options.controlIconsEnabled&&(t.options.controlIconsEnabled=!1,i.disable(t)),t.pi},isControlIconsEnabled:function(){return!!t.options.controlIconsEnabled},enableDblClickZoom:function(){return t.options.dblClickZoomEnabled=!0,t.pi},disableDblClickZoom:function(){return t.options.dblClickZoomEnabled=!1,t.pi},isDblClickZoomEnabled:function(){return!!t.options.dblClickZoomEnabled},enableMouseWheelZoom:function(){return t.enableMouseWheelZoom(),t.pi},disableMouseWheelZoom:function(){return t.disableMouseWheelZoom(),t.pi},isMouseWheelZoomEnabled:function(){return!!t.options.mouseWheelZoomEnabled},setZoomScaleSensitivity:function(e){return t.options.zoomScaleSensitivity=e,t.pi},setMinZoom:function(e){return t.options.minZoom=e,t.pi},setMaxZoom:function(e){return t.options.maxZoom=e,t.pi},setBeforeZoom:function(e){return t.options.beforeZoom=null===e?null:s.proxy(e,t.publicInstance),t.pi},setOnZoom:function(e){return t.options.onZoom=null===e?null:s.proxy(e,t.publicInstance),t.pi},zoom:function(e){return t.publicZoom(e,!0),t.pi},zoomBy:function(e){return t.publicZoom(e,!1),t.pi},zoomAtPoint:function(e,o){return t.publicZoomAtPoint(e,o,!0),t.pi},zoomAtPointBy:function(e,o){return t.publicZoomAtPoint(e,o,!1),t.pi},zoomIn:function(){return this.zoomBy(1+t.options.zoomScaleSensitivity),t.pi},zoomOut:function(){return this.zoomBy(1/(1+t.options.zoomScaleSensitivity)),t.pi},getZoom:function(){return t.getRelativeZoom()},resetZoom:function(){return t.resetZoom(),t.pi},resetPan:function(){return t.resetPan(),t.pi},reset:function(){return t.reset(),t.pi},fit:function(){return t.fit(),t.pi},contain:function(){return t.contain(),t.pi},center:function(){return t.center(),t.pi},updateBBox:function(){return t.updateBBox(),t.pi},resize:function(){return t.resize(),t.pi},getSizes:function(){return{width:t.width,height:t.height,realZoom:t.getZoom(),viewBox:t.viewport.getViewBox()}},destroy:function(){return t.destroy(),t.pi}}),this.publicInstance};var h=[],c=function(t,e){var o=s.getSvg(t);if(null===o)return null;for(var n=h.length-1;n>=0;n--)if(h[n].svg===o)return h[n].instance.getPublicInstance();return h.push({svg:o,instance:new l(o,e)}),h[h.length-1].instance.getPublicInstance()};e.exports=c},{"./control-icons":2,"./shadow-viewport":3,"./svg-utilities":5,"./uniwheel":6,"./utilities":7}],5:[function(t,e,o){var n=t("./utilities"),i="unknown";document.documentMode&&(i="ie"),e.exports={svgNS:"http://www.w3.org/2000/svg",xmlNS:"http://www.w3.org/XML/1998/namespace",xmlnsNS:"http://www.w3.org/2000/xmlns/",xlinkNS:"http://www.w3.org/1999/xlink",evNS:"http://www.w3.org/2001/xml-events",getBoundingClientRectNormalized:function(t){if(t.clientWidth&&t.clientHeight)return{width:t.clientWidth,height:t.clientHeight};if(t.getBoundingClientRect())return t.getBoundingClientRect();throw new Error("Cannot get BoundingClientRect for SVG.")},getOrCreateViewport:function(t,e){var o=null;if(o=n.isElement(e)?e:t.querySelector(e),!o){var i=Array.prototype.slice.call(t.childNodes||t.children).filter(function(t){return"defs"!==t.nodeName&&"#text"!==t.nodeName});1===i.length&&"g"===i[0].nodeName&&null===i[0].getAttribute("transform")&&(o=i[0])}if(!o){var s="viewport-"+(new Date).toISOString().replace(/\D/g,"");o=document.createElementNS(this.svgNS,"g"),o.setAttribute("id",s);var r=t.childNodes||t.children;if(r&&r.length>0)for(var a=r.length;a>0;a--)"defs"!==r[r.length-a].nodeName&&o.appendChild(r[r.length-a]);t.appendChild(o)}var l=[];return o.getAttribute("class")&&(l=o.getAttribute("class").split(" ")),~l.indexOf("svg-pan-zoom_viewport")||(l.push("svg-pan-zoom_viewport"),o.setAttribute("class",l.join(" "))),o},setupSvgAttributes:function(t){if(t.setAttribute("xmlns",this.svgNS),t.setAttributeNS(this.xmlnsNS,"xmlns:xlink",this.xlinkNS),t.setAttributeNS(this.xmlnsNS,"xmlns:ev",this.evNS),null!==t.parentNode){var e=t.getAttribute("style")||"";-1===e.toLowerCase().indexOf("overflow")&&t.setAttribute("style","overflow: hidden; "+e)}},internetExplorerRedisplayInterval:300,refreshDefsGlobal:n.throttle(function(){for(var t=document.querySelectorAll("defs"),e=t.length,o=0;e>o;o++){var n=t[o];n.parentNode.insertBefore(n,n)}},this.internetExplorerRedisplayInterval),setCTM:function(t,e,o){var n=this,s="matrix("+e.a+","+e.b+","+e.c+","+e.d+","+e.e+","+e.f+")";t.setAttributeNS(null,"transform",s),"transform"in t.style?t.style.transform=s:"-ms-transform"in t.style?t.style["-ms-transform"]=s:"-webkit-transform"in t.style&&(t.style["-webkit-transform"]=s),"ie"===i&&o&&(o.parentNode.insertBefore(o,o),window.setTimeout(function(){n.refreshDefsGlobal()},n.internetExplorerRedisplayInterval))},getEventPoint:function(t,e){var o=e.createSVGPoint();return n.mouseAndTouchNormalize(t,e),o.x=t.clientX,o.y=t.clientY,o},getSvgCenterPoint:function(t,e,o){return this.createSVGPoint(t,e/2,o/2)},createSVGPoint:function(t,e,o){var n=t.createSVGPoint();return n.x=e,n.y=o,n}}},{"./utilities":7}],6:[function(t,e,o){e.exports=function(){function t(t,e,o){var n=function(t){!t&&(t=window.event);var o={originalEvent:t,target:t.target||t.srcElement,type:"wheel",deltaMode:"MozMousePixelScroll"==t.type?0:1,deltaX:0,delatZ:0,preventDefault:function(){t.preventDefault?t.preventDefault():t.returnValue=!1}};return"mousewheel"==u?(o.deltaY=-1/40*t.wheelDelta,t.wheelDeltaX&&(o.deltaX=-1/40*t.wheelDeltaX)):o.deltaY=t.detail,e(o)};return c.push({element:t,fn:n,capture:o}),n}function e(t,e){for(var o=0;o<c.length;o++)if(c[o].element===t&&c[o].capture===e)return c[o].fn;return function(){}}function o(t,e){for(var o=0;o<c.length;o++)if(c[o].element===t&&c[o].capture===e)return c.splice(o,1)}function n(e,o,n,i){var s;s="wheel"===u?n:t(e,n,i),e[a](h+o,s,i||!1)}function i(t,n,i,s){"wheel"===u?cb=i:cb=e(t,s),t[l](h+n,cb,s||!1),o(t,s)}function s(t,e,o){n(t,u,e,o),"DOMMouseScroll"==u&&n(t,"MozMousePixelScroll",e,o)}function r(t,e,o){i(t,u,e,o),"DOMMouseScroll"==u&&i(t,"MozMousePixelScroll",e,o)}var a,l,u,h="",c=[];return window.addEventListener?(a="addEventListener",l="removeEventListener"):(a="attachEvent",l="detachEvent",h="on"),u="onwheel"in document.createElement("div")?"wheel":void 0!==document.onmousewheel?"mousewheel":"DOMMouseScroll",{on:s,off:r}}()},{}],7:[function(t,e,o){function n(t){return function(e){window.setTimeout(e,t)}}e.exports={extend:function(t,e){t=t||{};for(var o in e)this.isObject(e[o])?t[o]=this.extend(t[o],e[o]):t[o]=e[o];return t},isElement:function(t){return t instanceof HTMLElement||t instanceof SVGElement||t instanceof SVGSVGElement||t&&"object"==typeof t&&null!==t&&1===t.nodeType&&"string"==typeof t.nodeName},isObject:function(t){return"[object Object]"===Object.prototype.toString.call(t)},isNumber:function(t){return!isNaN(parseFloat(t))&&isFinite(t)},getSvg:function(t){var e,o;if(this.isElement(t))e=t;else{if(!("string"==typeof t||t instanceof String))throw new Error("Provided selector is not an HTML object nor String");if(e=document.querySelector(t),!e)throw new Error("Provided selector did not find any elements. Selector: "+t)}if("svg"===e.tagName.toLowerCase())o=e;else if("object"===e.tagName.toLowerCase())o=e.contentDocument.documentElement;else{if("embed"!==e.tagName.toLowerCase())throw"img"===e.tagName.toLowerCase()?new Error('Cannot script an SVG in an "img" element. Please use an "object" element or an in-line SVG.'):new Error("Cannot get SVG.");o=e.getSVGDocument().documentElement}return o},proxy:function(t,e){return function(){return t.apply(e,arguments)}},getType:function(t){return Object.prototype.toString.apply(t).replace(/^\[object\s/,"").replace(/\]$/,"")},mouseAndTouchNormalize:function(t,e){if(void 0===t.clientX||null===t.clientX)if(t.clientX=0,t.clientY=0,void 0!==t.changedTouches&&t.changedTouches.length){if(void 0!==t.changedTouches[0].clientX)t.clientX=t.changedTouches[0].clientX,t.clientY=t.changedTouches[0].clientY;else if(void 0!==t.changedTouches[0].pageX){var o=e.getBoundingClientRect();t.clientX=t.changedTouches[0].pageX-o.left,t.clientY=t.changedTouches[0].pageY-o.top}}else void 0!==t.originalEvent&&void 0!==t.originalEvent.clientX&&(t.clientX=t.originalEvent.clientX,t.clientY=t.originalEvent.clientY)},isDblClick:function(t,e){if(2===t.detail)return!0;if(void 0!==e&&null!==e){var o=t.timeStamp-e.timeStamp,n=Math.sqrt(Math.pow(t.clientX-e.clientX,2)+Math.pow(t.clientY-e.clientY,2));return 250>o&&10>n}return!1},now:Date.now||function(){return(new Date).getTime()},throttle:function(t,e,o){var n,i,s,r=this,a=null,l=0;o||(o={});var u=function(){l=o.leading===!1?0:r.now(),a=null,s=t.apply(n,i),a||(n=i=null)};return function(){var h=r.now();l||o.leading!==!1||(l=h);var c=e-(h-l);return n=this,i=arguments,0>=c||c>e?(clearTimeout(a),a=null,l=h,s=t.apply(n,i),a||(n=i=null)):a||o.trailing===!1||(a=setTimeout(u,c)),s}},createRequestAnimationFrame:function(t){var e=null;return"auto"!==t&&60>t&&t>1&&(e=Math.floor(1e3/t)),null===e?window.requestAnimationFrame||n(33):n(e)}}},{}]},{},[1]);


!function(t,e){if("function"==typeof define&&define.amd)define(["d3-collection","d3-selection"],e);else if("object"==typeof module&&module.exports){var n=require("d3-collection"),r=require("d3-selection");module.exports=e(n,r)}else{var o=t.d3;t.d3.tip=e(o,o)}}(this,function(t,e){return function(){function n(t){C=d(t),C&&(H=C.createSVGPoint(),b.appendChild(E))}function r(){return"n"}function o(){return[0,0]}function l(){return" "}function i(){var t=h();return{top:t.n.y-E.offsetHeight,left:t.n.x-E.offsetWidth/2}}function u(){var t=h();return{top:t.s.y,left:t.s.x-E.offsetWidth/2}}function s(){var t=h();return{top:t.e.y-E.offsetHeight/2,left:t.e.x}}function f(){var t=h();return{top:t.w.y-E.offsetHeight/2,left:t.w.x-E.offsetWidth}}function a(){var t=h();return{top:t.nw.y-E.offsetHeight,left:t.nw.x-E.offsetWidth}}function c(){var t=h();return{top:t.ne.y-E.offsetHeight,left:t.ne.x}}function p(){var t=h();return{top:t.sw.y,left:t.sw.x-E.offsetWidth}}function y(){var t=h();return{top:t.se.y,left:t.se.x}}function m(){var t=e.select(document.createElement("div"));return t.style("position","absolute").style("top",0).style("opacity",0).style("pointer-events","none").style("box-sizing","border-box"),t.node()}function d(t){var e=t.node();return e?"svg"===e.tagName.toLowerCase()?e:e.ownerSVGElement:null}function g(){return null==E&&(E=m(),b.appendChild(E)),e.select(E)}function h(){for(var t=S||e.event.target;null==t.getScreenCTM&&null==t.parentNode;)t=t.parentNode;var n={},r=t.getScreenCTM(),o=t.getBBox(),l=o.width,i=o.height,u=o.x,s=o.y;return H.x=u,H.y=s,n.nw=H.matrixTransform(r),H.x+=l,n.ne=H.matrixTransform(r),H.y+=i,n.se=H.matrixTransform(r),H.x-=l,n.sw=H.matrixTransform(r),H.y-=i/2,n.w=H.matrixTransform(r),H.x+=l,n.e=H.matrixTransform(r),H.x-=l/2,H.y-=i/2,n.n=H.matrixTransform(r),H.y+=i,n.s=H.matrixTransform(r),n}function x(t){return"function"==typeof t?t:function(){return t}}var v=r,w=o,T=l,b=document.body,E=m(),C=null,H=null,S=null;n.show=function(){var t=Array.prototype.slice.call(arguments);t[t.length-1]instanceof SVGElement&&(S=t.pop());var e,r=T.apply(this,t),o=w.apply(this,t),l=v.apply(this,t),i=g(),u=A.length,s=document.documentElement.scrollTop||b.scrollTop,f=document.documentElement.scrollLeft||b.scrollLeft;for(i.html(r).style("opacity",1).style("pointer-events","all");u--;)i.classed(A[u],!1);return e=W.get(l).apply(this),i.classed(l,!0).style("top",e.top+o[0]+s+"px").style("left",e.left+o[1]+f+"px"),n},n.hide=function(){var t=g();return t.style("opacity",0).style("pointer-events","none"),n},n.attr=function(t){if(arguments.length<2&&"string"==typeof t)return g().attr(t);var r=Array.prototype.slice.call(arguments);return e.selection.prototype.attr.apply(g(),r),n},n.style=function(t){if(arguments.length<2&&"string"==typeof t)return g().style(t);var r=Array.prototype.slice.call(arguments);return e.selection.prototype.style.apply(g(),r),n},n.direction=function(t){return arguments.length?(v=null==t?t:x(t),n):v},n.offset=function(t){return arguments.length?(w=null==t?t:x(t),n):w},n.html=function(t){return arguments.length?(T=null==t?t:x(t),n):T},n.rootElement=function(t){return arguments.length?(b=null==t?t:x(t),n):b},n.destroy=function(){return E&&(g().remove(),E=null),n};var W=t.map({n:i,s:u,e:s,w:f,nw:a,ne:c,sw:p,se:y}),A=W.keys();return n}});
