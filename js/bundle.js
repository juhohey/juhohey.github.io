var id = (function () {
	/**
	* Http module
	* Makes requests
	*
	*/
	var http = function http() {

	  'use strict';

	  var http = {};
	  //Private
	  function request() {}

	  //Public
	  /**
	  * Request
	  * @param route - required
	  * @param method - default GET
	  * @param params - default {} if method!=GET
	  * @param headers - optional
	  * @return Promise.then response
	  */
	  http.request = function (route, method, params, headers, file) {

	    var req = getReq(route, method, params, headers);
	    req.open(method, route, true);
	    if (headers) req.setRequestHeader(headers.name, headers.value);else setHeadersForParams(file);
	    var parsedParams = file ? file : parseParams(params);

	    return new Promise(function (resolve, reject) {

	      if (!route) reject({ status: "No route present" });
	      if (method !== "GET" && !params) params = "";

	      //console.log("HTTP.req.send",route, method, parsedParams);
	      try {
	        if (parsedParams) req.send(parsedParams);else req.send();
	      } catch (routeExeption) {
	        reject({ status: "408 Request Timeout" });
	      }

	      req.onreadystatechange = function () {

	        if (req.readyState === 4) {
	          if (req.status === 200) resolve(parseResponse(req.response));else reject(req.response);
	        }
	      };
	      req.ontimeout = function () {
	        reject({ status: "408 Request Timeout" });
	      };
	      req.onerror = function (err) {
	        reject({ status: err });
	      };
	    });

	    /**
	    * Method
	    * @param bar
	    */
	    function setHeadersForParams(file) {
	      if (!file) req.setRequestHeader("content-type", "application/x-www-form-urlencoded");
	    }
	  };
	  http.get = function (route, headers) {
	    return http.request(route, "GET", null, headers);
	  };
	  http.post = function (route, params, headers) {
	    return http.request(route, "POST", params, headers);
	  };
	  http.put = function (route, params, headers) {
	    return http.request(route, "PUT", params, headers);
	  };
	  http.delete = function (route, params, headers) {
	    return http.request(route, "DELETE", params, headers);
	  };
	  http.file = function (route, method, params, headers) {
	    var file = getFile(params);
	    //  console.log("http file",file);
	    return http.request(route, method, params, headers, file);
	  };

	  //Helper
	  function getReq(route, method, params, headers) {

	    var req = new XMLHttpRequest();
	    method = method || "GET";
	    return req;
	  }

	  function getFile(params) {
	    var formData = new FormData();
	    formData.append("file", params.file);
	    delete params['file'];
	    for (var k in params) {
	      formData.append(k, params[k]);
	    }return formData;
	  }

	  /**
	  * Parse response to corrent form
	  * @param req.respons
	  */
	  function parseResponse(r) {
	    if (r[0] === "[" || r[0] === "{") return JSON.parse(r);
	    return r;
	  }

	  /**
	  * Parse parameters
	  * @param params
	  */
	  function parseParams(params) {
	    var s = "";

	    getRecursive(params);
	    if (s[s.length - 1] === "&") s = s.substring(0, s.length - 1);
	    return s;
	    //helper
	    function getRecursive(p) {

	      for (var prop in p) {
	        if (p.hasOwnProperty(prop)) {
	          if (prop instanceof Object && !prop instanceof Array) {
	            return getRecursiveprop(prop);
	          } else s += prop + "=" + encodeURIComponent(p[prop]) + "&";
	        }
	      }
	    }
	  }

	  //promisePolyfill();
	  return http;
	};

	var _export = http();

	var ensureProperty = function ensureProperty(object, key, type) {
	  object[key] = object[key] || type;
	  //ref...
	  return object;
	};

	var store = function store() {
	  'use strict';

	  var store = {};

	  var STORES = [];
	  var callbacks = [];

	  store.listen = function (name, cb) {
	    callbacks = ensureProperty(callbacks, name, []);
	    callbacks[name].push(cb);
	  };
	  store.set = function (name, value) {
	    var clone = value instanceof Array ? value.slice(0) : value;
	    STORES = ensureProperty(STORES, name, []);
	    STORES[name].push(clone);
	    store.dispatch(name);
	  };
	  store.get = function (name) {
	    return STORES[name] ? STORES[name][STORES[name].length - 1] : [];
	  };
	  store.dispatch = function (name) {
	    if (callbacks[name]) callbacks[name].forEach(function (cb) {
	      cb(store.get(name));
	    });
	  };

	  return store;
	};

	var store$1 = store();

	/**
	* Module
	*/
	var scale = function scale() {
	  'use strict';

	  var scale = {};

	  var WIDTH = 720;
	  var HEIGHT = 500;
	  scale.getWidth = function () {
	    return WIDTH;
	  };

	  scale.should = function () {
	    var screen = window.innerWidth;
	    return screen < WIDTH;
	  };
	  scale.getCoordinates = function (pointArray) {
	    var screen = window.innerWidth;
	    var percent = screen / WIDTH;
	    return pointArray.map(function (item) {
	      item.x = Math.floor(percent * item.x);
	      item.y = Math.floor(percent * item.y);
	      return item;
	    });
	  };
	  scale.getHeatValues = function (pointArray) {
	    var screen = window.innerWidth;
	    var percent = screen / WIDTH;
	    var percentY = screen / (HEIGHT * scale.getWidthPercent());
	    return pointArray.map(function (item) {
	      item.x = Math.floor(percent * item.x);
	      item.y = Math.floor(percentY * item.y);
	      return item;
	    });
	  };
	  scale.scaleValues = function (pointArray) {
	    var screen = window.innerWidth;
	    var percent = screen / WIDTH;
	    return pointArray.map(function (item) {
	      item.value = Math.floor(percent * item.value * 1.5);
	      return item;
	    });
	  };
	  scale.getScaled = function (coord) {
	    var screen = window.innerWidth;
	    var percent = screen / WIDTH;
	    return Math.floor(percent * coord);
	  };
	  scale.getWidthPercent = function () {
	    var screen = window.innerWidth;
	    return screen / WIDTH;
	  };

	  return scale;
	};

	var scale$1 = scale();

	var heatInstance = function heatInstance() {
	  'use strict';

	  var heatInstance = {};
	  var instance = void 0;
	  var _element = void 0;

	  heatInstance.init = function (selector) {

	    _element = getElement(selector);
	    // create a heatmap instance
	    instance = h337.create({
	      container: _element,
	      maxOpacity: 0.6,
	      radius: 50,
	      blur: 0.90,
	      // backgroundColor with alpha so you can see through it
	      backgroundColor: 'rgba(0, 0, 58, 0)'
	    });

	    addEvents(_element);
	    addInitial();
	    //addTestCases();
	    return instance;
	  };

	  function addInitial() {
	    var data = {
	      max: 200,
	      min: 0,
	      data: []
	    };
	    instance.setData(data);
	  }
	  heatInstance.destroy = function () {
	    var el = _element.querySelector('canvas');
	    console.log(el);
	    _element.removeChild(el);
	  };
	  heatInstance.setData = function (data) {
	    instance.addData(data);
	    if (scale$1.should()) {
	      var c = _element.querySelector('canvas');
	      c.style.height = 500 * scale$1.getWidthPercent() + "px";
	      c.style.width = "100%";
	    }
	  };

	  function addEvents(element) {
	    element.parentElement.addEventListener('click', addTestPoint);
	  }
	  function getElement(s) {
	    return document.querySelector(s);
	  }

	  function addTestCases() {
	    var times = 5;
	    var interval = window.setInterval(function () {
	      if (times) {
	        times--;
	        addPoint({ x: 500, y: times * 100, value: 10 });
	      } else window.clearInterval(interval);
	    }, 1000);
	  }

	  function addPoint(point) {
	    instance.addData(point);
	  }

	  function addTestPoint(event) {
	    var x = event.layerX;
	    var y = event.layerY;
	    instance.addData({ x: x, y: y, value: 100 });
	    console.log(event);
	  }

	  return heatInstance;
	};

	var heat = heatInstance();

	var heatmap = function heatmap() {
	  'use strict';

	  var API_ADDR = "http://40.113.85.15/cashmesh?get_heatmap";
	  var _lastData = void 0;
	  var heatmap = Vue.extend({
	    template: '<div class="heatmap-container">\n      <div class="app-header">\n        <div class="container">\n          <div class="app-heading">\n            <h1 class="app-heading-heading">Heatmap</h1>\n            <p class="app-description">\n              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n            </p>\n          </div>\n        </div>\n      </div>\n      <div class="heatmap" id="heatmap">\n    </div>',
	    data: function data() {
	      return {};
	    },
	    mounted: function mounted() {
	      heat.init('#heatmap');
	      _export.get(API_ADDR).then(function (data) {
	        _lastData = data;
	        setData(data.splice(0));
	      }).catch(function (err) {
	        console.error(err);
	      });

	      // store.listen('resize', ()=>{
	      //   heat.destroy();
	      //   heat.init('#heatmap');
	      //   setData(_lastData);
	      // });
	    }
	  });

	  function setData(data) {
	    if (scale$1.should()) {
	      data = scale$1.getHeatValues(data);
	      data = scale$1.scaleValues(data);
	      console.log(data);
	    }
	    heat.setData(data);
	  }

	  return heatmap;
	};

	var heatmap$1 = heatmap();

	var ping = function ping() {
	  'use strict';

	  var WIDTH = 720;

	  var ping = {};
	  var _data = void 0;
	  var _selector = void 0;
	  var _svg = void 0;
	  var _element = void 0;
	  var _I = 1;
	  var _made = false;
	  var USER_AMOUNT = 1;
	  var MAX_POINTS = USER_AMOUNT * 8;
	  var _pinnedUsers = [];
	  var _tips = [{}, {}, {}];
	  var _shouldShowTip = false;

	  var _accepted = [];

	  var _points = [];
	  var _text = [];
	  var _colors = ['#45CCFF', '#FFD432', '#B243FF'];

	  var xscale = d3.scale.linear().domain([0, 50.0]).range([0, 720]),
	      yscale = d3.scale.linear().domain([0, 50]).range([0, 500]),
	      map = d3.floorplan().xScale(xscale).yScale(yscale),
	      imagelayer = d3.floorplan.imagelayer(),
	      heatmap = d3.floorplan.heatmap(),
	      vectorfield = d3.floorplan.vectorfield(),
	      pathplot = d3.floorplan.pathplot(),
	      overlays = d3.floorplan.overlays().editMode(true),
	      mapdata = {};

	  var screen = window.innerWidth;
	  var base = 50;
	  var __h = base;
	  var __w = base;
	  if (scale$1.should()) {
	    __h = scale$1.getScaled(__h) * .95;
	    __w = scale$1.getScaled(__w);
	  }console.log(__h, __w);
	  mapdata[imagelayer.id()] = [{
	    url: 'images/room.png',
	    x: 0,
	    y: 0,
	    height: __h,
	    width: __w
	  }];

	  map.addLayer(imagelayer).addLayer(heatmap).addLayer(vectorfield).addLayer(pathplot).addLayer(overlays);

	  function _init() {

	    _accepted = [];

	    _points = [];
	    _text = [];
	  }
	  ping.make = function (selector) {
	    _selector = selector;
	    _element = document.querySelector(_selector);
	    setSvg();
	    //mapdata[heatmap.id()] = data.heatmap;
	    //	mapdata[overlays.id()] = data.overlays;
	    //	mapdata[vectorfield.id()] = data.vectorfield;
	    //mapdata[pathplot.id()] = data.pathplot;
	    make();
	    addListener();
	    _init();
	  };
	  ping.addData = function (data) {
	    //Mp& add data
	    var mapped = mapData(data);
	    setData(mapped);

	    //Remove
	    if (_points.length >= MAX_POINTS) removePrevious();
	    if (_text.length >= USER_AMOUNT * 2) removePreviousText();

	    if (_shouldShowTip) ping.showTip();
	  };

	  ping.setPinned = function (pinnedUsersList) {
	    _pinnedUsers = pinnedUsersList; //.filter((item) => {return _accepted.indexOf(item) === -1;});
	  };

	  ping.showTip = function () {
	    if (_pinnedUsers.length) {
	      _pinnedUsers.forEach(function (user) {
	        var pinPoint = void 0;
	        var pinIndex = void 0;
	        _points.map(function (point, index) {
	          if (point.active && point.id === user) {
	            _shouldShowTip = true;
	            pinPoint = point;
	            pinIndex = index;
	          }
	        });
	        if (pinPoint) shopwTip(pinPoint.self, pinPoint.id, pinPoint.accepted, pinIndex);
	      });
	    }
	  };
	  ping.hideTip = function () {
	    _tip.hide();
	    _shouldShowTip = false;
	  };

	  function shopwTip(target, id, accepted, index) {

	    var element = d3.select('.' + target)[0];
	    var activeTip = void 0;
	    for (var i = 0; i < _tips.length; i++) {
	      if (_tips[i].id === id) activeTip = _tips[i];else if (!_tips[i].active) activeTip = _tips[i];
	    }
	    activeTip.active = true;
	    activeTip.id = id;
	    activeTip.tip.show({ id: id, accepted: accepted, index: index }, element[0]).offset([-10, 0]);
	  }

	  function removePrevious() {
	    for (var i = 0; i < USER_AMOUNT; i++) {
	      _svg.select('.' + _points[0].self).remove();
	      //  console.log('REMOVE', _points[0].self);
	      _points.shift();
	    }
	  }
	  function removePreviousText() {
	    if (_text.length) for (var i = 0; i < USER_AMOUNT; i++) {
	      _svg.select('.' + _text[0].self).remove();
	      //  console.log('REMOVE', _text[0].self);
	      _text.shift();
	    }
	  }

	  function setSvg() {

	    var __h = WIDTH * 0.69;
	    var __w = WIDTH;
	    if (scale$1.should()) {
	      __h = scale$1.getScaled(__h);
	      __w = scale$1.getScaled(__w);
	    }

	    _svg = d3.select(_selector).append("svg").attr("height", __h).attr("width", __w);
	    console.log(WIDTH * 0.69);

	    // setTimeout(function () {
	    //   // var svgElement = _element.querySelector('svg');
	    //   // var panZoomTiger = svgPanZoom(svgElement, {
	    //   //   panEnabled: false
	    //   // });
	    // }, 100);
	  }

	  function make() {
	    _made = true;
	    _svg.datum(mapdata).call(map);

	    /* Initialize tooltip */
	    _tips.forEach(function (item) {
	      item.tip = d3.tip().attr('class', 'd3-tip').html(function (d) {

	        var end = "</div>";
	        var accepted = _accepted.indexOf(d.id) > -1 ? '<button action="section" class="btn tooltip-btn-large">Section profile</button>' : '<button action="accept" index="' + d.index + '" id="' + d.id + '" class="btn tooltip-btn-red">Accept</button>';
	        var markup = '\n            <span>' + d.id + '</span>\n            <div class="tooltip-side">\n              <button action="show" class="btn tooltip-btn">Section</button>\n          ';
	        return markup + accepted + end;
	      });

	      item.active = false;
	      _svg.call(item.tip);
	      return item;
	    });
	    addTipListeners();
	  }

	  function addTipListeners() {
	    var elements = document.querySelectorAll('.d3-tip');
	    for (var i = 0; i < elements.length; i++) {
	      elements[i].addEventListener('click', tipListener);
	    }
	  }
	  function tipListener(event) {
	    var action = event.target.getAttribute('action');
	    if (action === 'show') {
	      store$1.set('modal', true);
	    } else if (action === 'accept') {
	      console.log(event);
	      var index = event.target.getAttribute('index');
	      var id = event.target.getAttribute('id');
	      _points[index].accepted = true;
	      _accepted.push(id);
	      event.target.style.display = "none";
	      event.target.textContent = "Section profile";
	      store$1.set("unpin_user", id);
	    } else if (action === 'section') {
	      store$1.set('router', '/profile');
	    }
	  }

	  function addListener() {
	    _element.addEventListener('click', function (event) {
	      //console.log('add', event.x, event.y);
	      setCircle(event.x, event.y, '5');
	    });
	  }

	  function setCircle(x, y, id) {

	    var selfId = '_' + id + getrandom();
	    setPreviousCirclesNonActive(id);

	    var activeUser = isActiveUser(id);

	    var c = _svg.append("svg:circle").attr("r", 20).attr("cx", function (d) {
	      return x;
	    }).attr("cy", function (d) {
	      return y + 25;
	    }).attr('fill', getColor(id)).attr('class', function () {
	      var s = selfId;
	      s += activeUser ? ' circle-active' : ' circle';
	      return s;
	    });

	    var instance = { x: x, y: y, id: id, self: selfId };
	    if (activeUser) instance.active = true;
	    _points.push(instance);
	  }
	  function setText(x, y, id) {

	    var selfId = '_' + id + getrandom();
	    _svg.append("text").attr("x", function (d) {
	      return x;
	    }).attr("y", y - 70).attr("dy", ".35em").text(function () {
	      return 'id: ' + id;
	    }).attr('class', selfId);

	    _text.push({ x: x, y: y, id: id, self: selfId });
	  }

	  function isActiveUser(id) {
	    return _pinnedUsers.indexOf(id) > -1;
	  }

	  function setPreviousCirclesNonActive(id) {
	    _points.forEach(function (el, i, arr) {
	      if (el.active && el.id == id) {
	        _svg.select('.' + el.self).attr('fill', _colors[el.id]);
	        console.log(el);
	      }
	    });
	  }

	  function getColor(id) {
	    if (isActiveUser(id)) {
	      //console.log('GET COLOR IS isActiveUser', id, _accepted, _accepted.indexOf(id) === -1);
	      var c = void 0;
	      c = _accepted.indexOf(id) === -1 ? 'tomato' : _colors[id];
	      //    console.log(c, 'CCCCC');
	      return c;
	    } else {
	      //  let rand = Math.floor(Math.random() * _colors.length);
	      return _colors[id];
	    }
	  }

	  function removeCircle() {
	    var fade = _points[_points.length - _I];
	    _svg.select('.' + fade.selfId).remove();
	    _I++;
	  }
	  function setData(data) {

	    // if(data.length > 1)  data.forEach( (el,i,arr)=>{
	    //   setCircle(el.x, el.y, el.id);
	    // });
	    data.forEach(function (user) {
	      user.data.forEach(function (point) {
	        setCircle(point.x, point.y, user.id);
	      });
	      var average = getAverage(user.data);
	      //  setText(average.x, average.y, user.id);
	    });
	  }

	  function getAverage(dataArr) {
	    var avg = {};
	    var sumX = 0;
	    var sumY = 0;
	    dataArr.forEach(function (point) {
	      sumX += point.x;
	      sumY += point.y;
	    });
	    avg.x = sumX / dataArr.length;
	    avg.y = sumY / dataArr.length;
	    return avg;
	  }

	  function mapData(data) {

	    var users = getUsersObj(data);
	    var userArr = [];
	    for (var k in users) {
	      userArr.push({
	        id: k,
	        data: users[k]
	      });
	    }
	    return userArr;
	  }
	  function getUsersObj(data) {
	    var users = {};
	    data.forEach(function (point) {
	      users[point.id] = users[point.id] || [];
	      users[point.id].push({ x: point.x, y: point.y });
	    });
	    return users;
	  }

	  function getrandom() {
	    return Math.random().toString(36).substring(7);
	  }

	  window.addData = function (data, path) {
	    // let fn = path ? pathplot.id : vectorfield.id;
	    // mapdata[fn()] = data;
	    // make();
	    _svg.append("svg:circle").attr("r", 4).attr("cx", function (d) {
	      return 50;
	    }).attr("cy", function (d) {
	      return 50;
	    });
	  };

	  return ping;
	};

	var ping$1 = ping();

	var toaster = function toaster() {

	  var longMessage = "This is a longer message that won't fit on one line. It is, inevitably, quite a boring thing. Hopefully it is still useful.";
	  var shortMessage = 'Your message was sent';

	  var toast = {};
	  var make = function () {
	    // Any snackbar that is already shown
	    var previous = null;

	    /*
	    <div class="paper-snackbar">
	      <button class="action">Dismiss</button>
	      This is a longer message that won't fit on one line. It is, inevitably, quite a boring thing. Hopefully it is still useful.
	    </div>
	    */

	    return function (message, actionText, action) {
	      if (previous) {
	        previous.dismiss();
	      }
	      var snackbar = document.createElement('div');
	      snackbar.className = 'paper-snackbar';
	      snackbar.dismiss = function () {
	        snackbar.style.opacity = 0;
	      };
	      var text = document.createTextNode(message);
	      snackbar.appendChild(text);
	      if (actionText) {
	        if (!action) {
	          action = snackbar.dismiss.bind(snackbar);
	        }
	        var actionButton = document.createElement('button');
	        actionButton.className = 'action';
	        actionButton.innerHTML = actionText;
	        actionButton.addEventListener('click', action);
	        snackbar.appendChild(actionButton);
	      }
	      setTimeout(function () {
	        snackbar.dismiss();
	      }.bind(snackbar), 3000);

	      snackbar.addEventListener('transitionend', function (event, elapsed) {
	        if (event.propertyName === 'opacity' && this.style.opacity == 0) {
	          this.parentElement.removeChild(this);
	          if (previous === this) {
	            previous = null;
	          }
	        }
	      }.bind(snackbar));

	      toast.dismiss = snackbar.dismiss;

	      previous = snackbar;
	      document.body.appendChild(snackbar);
	      // In order for the animations to trigger, I have to force the original style to be computed, and then change it.
	      getComputedStyle(snackbar).bottom;
	      snackbar.style.bottom = '0px';
	      snackbar.style.opacity = 1;
	    };

	    // document.querySelector('.toaster').addEventListener('click', function() {
	    //   createSnackbar(shortMessage, 'Dismiss');
	    // });
	  }();

	  toast.make = make;
	  return toast;
	};

	var toast = toaster();

	/**
	* Module
	*/
	var pingmap = function pingmap() {
	  'use strict';

	  var POINT_MAP = 'http://40.113.85.15/cashmesh?get_positions';
	  var USER_PING = 'http://40.113.85.15/cashmesh?get_active_tickets';
	  var UNPIN_USER = 'http://40.113.85.15/cashmesh?unpin_user=';
	  var _intervals = {};
	  var _isToast = false;
	  var pingmap = Vue.extend({
	    template: '<div class="view">\n    <div class="app-header">\n      <div class="container">\n        <div class="app-heading">\n          <h1 class="app-heading-heading">Customer map</h1>\n          <p class="app-description">\n            Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n          </p>\n        </div>\n      </div>\n    </div>\n      <div id="ping"></div>\n    </div>',
	    data: function data() {
	      return {};
	    },
	    created: function created() {},
	    mounted: function mounted() {
	      ping$1.make("#ping");

	      startPing();
	      startPin();

	      store$1.listen('unpin_user', function (id) {
	        _export.get('' + UNPIN_USER + id).then(function (succes) {
	          console.info(succes);
	        });
	      });
	    },
	    destroyed: function destroyed() {
	      for (var k in _intervals) {
	        window.clearInterval(_intervals[k]);
	      }
	      var elements = document.querySelectorAll('.d3-tip');
	      for (var i = 0; i < elements.length; i++) {
	        elements[i].parentElement.removeChild(elements[i]);
	      }
	    }
	  });

	  function startPing() {
	    _intervals.point = setInterval(function () {
	      _export.get(POINT_MAP).then(function (_data) {
	        //console.log(_data);
	        _data = [_data];
	        if (scale$1.should()) {
	          _data = scale$1.getCoordinates(_data);
	          console.log(_data);
	        }
	        ping$1.addData(_data);
	      }).catch(function (err) {
	        console.error(err);
	      });
	    }, 1500);
	  }

	  function startPin() {
	    _intervals.pin = setInterval(function () {
	      _export.get(USER_PING).then(function (_data) {
	        var pinnedUsers = getPinnedUsers(_data);
	        if (pinnedUsers.length) {
	          ping$1.setPinned(pinnedUsers);
	          ping$1.showTip();
	        }
	      }).catch(function (err) {
	        console.error(err);
	      });
	    }, 1500);
	  }

	  function makeToast() {
	    if (_isToast) return;
	    _isToast = true;
	    //  ping.showTip();
	    toast.make("user needs help", 'view', function () {
	      console.log('Dismiss');

	      toast.dismiss();
	      _isToast = false;
	    });
	  }

	  function getPinnedUsers(data) {
	    return data.map(function (item, index) {
	      if (item) return index;
	    }).filter(function (item, index) {
	      if (index === 0 && item === 0 || item) {
	        return index || '0';
	      }
	    }).map(function (item) {

	      return item.toString();
	    });
	  }

	  return pingmap;
	};

	var pingmap$1 = pingmap();

	var pingmap$2 = function pingmap() {
	  'use strict';

	  var POINT_MAP = 'http://40.113.85.15/cashmesh?get_positions';
	  var USER_PING = 'http://40.113.85.15/cashmesh?get_active_tickets';
	  var _intervals = {};
	  var _isToast = false;
	  var pingmap = Vue.extend({
	    template: '<div class="view">\n      <div class="profile">\n\n        <div class="profile-header" v-bind:style="{\'background-image\': getBg()}">\n          <div class="container">\n            <h1 class="profile-heading">Outwear</h1>\n          </div>\n        </div>\n\n        <div class="container">\n          <div class="profile-body">\n            <h3 class="profile-body-heading">Top items</h3>\n            <div class="profile-list">\n\n              <ul class="profile-item-list">\n\n                <li class="profile-item">\n                  <div class="profile-item-col">\n                    <div class="row">\n                      <div class="col-sm-3 col-xs-3">\n                        <span class="profile-avatar"><img class="profile-image" src="/images/sweater.png"></span>\n\n                      </div>\n                      <div class="col-sm-9 col-xs-9">\n                        <span class="name">Sweater</span>\n                        <span class="profile-item-desc">\n                          Lorem ipsum dolor sit amet, consectetur adipisicing elit,\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                  <div class="profile-item-col-2">\n                    <span class="profile-item-price">200\u20AC</span>\n                  </div>\n                  <div class="profile-item-col-3">\n                    <span class="profile-item-price">Available sizes</span>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">s</span>\n                      <span class="sizes sizes-xs sizes-label">20</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">m</span>\n                      <span class="sizes sizes-xs sizes-label">10</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">l</span>\n                      <span class="sizes sizes-xs sizes-label">0</span>\n                    </div>\n                  </div>\n\n                </li>\n                <li class="profile-item">\n                  <div class="profile-item-col">\n                    <div class="row">\n                      <div class="col-sm-3 col-xs-3">\n                        <span class="profile-avatar"><img class="profile-image" src="/images/hoodie.png"></span>\n\n                      </div>\n                      <div class="col-sm-9 col-xs-9">\n                        <span class="name">Hoodie</span>\n                        <span class="profile-item-desc">\n                          Lorem ipsum dolor sit amet, consectetur adipisicing elit,\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                  <div class="profile-item-col-2">\n                    <span class="profile-item-price-discounted">80\u20AC</span>\n                    <span class="profile-item-price-discount">50\u20AC</span>\n                  </div>\n                  <div class="profile-item-col-3">\n                    <span class="profile-item-price">Available sizes</span>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">s</span>\n                      <span class="sizes sizes-xs sizes-label">20</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">m</span>\n                      <span class="sizes sizes-xs sizes-label">10</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">l</span>\n                      <span class="sizes sizes-xs sizes-label">0</span>\n                    </div>\n                  </div>\n\n\n                </li>\n                <li class="profile-item">\n                  <div class="profile-item-col">\n                    <div class="row">\n                      <div class="col-sm-3 col-xs-3">\n                        <span class="profile-avatar"><img class="profile-image" src="/images/shirt.png"></span>\n\n                      </div>\n                      <div class="col-sm-9 col-xs-9">\n                        <span class="name">Shirt</span>\n                        <span class="profile-item-desc">\n                          Lorem ipsum dolor sit amet, consectetur adipisicing elit,\n                        </span>\n                      </div>\n                    </div>\n                  </div>\n                  <div class="profile-item-col-2">\n                    <span class="profile-item-price">20\u20AC</span>\n                  </div>\n                  <div class="profile-item-col-3">\n                    <span class="profile-item-price">Available sizes</span>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">s</span>\n                      <span class="sizes sizes-xs sizes-label">20</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">m</span>\n                      <span class="sizes sizes-xs sizes-label">10</span>\n                    </div>\n                    <div class="profile-item-sizes">\n                      <span class="sizes sizes-xs sizes-label">l</span>\n                      <span class="sizes sizes-xs sizes-label">0</span>\n                    </div>\n                  </div>\n\n\n                </li>\n              </ul>\n\n\n            </div>\n          </div>\n        </div>\n\n      </div>\n    </div>',
	    data: function data() {
	      return {};
	    },

	    methods: {
	      getBg: function getBg() {
	        return "url('/images/bg-outwear.jpg')";
	      }
	    },
	    created: function created() {},
	    mounted: function mounted() {},
	    destroyed: function destroyed() {}
	  });

	  return pingmap;
	};

	var profile = pingmap$2();

	var dashboard = function dashboard() {
	  'use strict';

	  var dashboard = Vue.extend({
	    template: '\n      <div class="view">\n\n      <div class="app-header dashboard">\n        <div class="container">\n          <div class="app-heading">\n            <h1 class="app-heading-heading">Dashboard</h1>\n            <p class="app-description">\n              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n            </p>\n          </div>\n        </div>\n      </div>\n\n      <div class="dashboard-body">\n        <div class="container">\n        <div class="row">\n          <div class="dashboard-col" v-for="section in sections">\n          <div class="card card--big dashboard-card a">\n            <div v-bind:style="{\'background-image\': getBg(section.bg)}"class="card__image card__image__bg"></div>\n            <h2 class="card__title">{{section.name}}</h2>\n            <span class="card__subtitle">{{section.subtitle}}</span>\n            <p class="card__text">{{section.desc}}<br>\n            </p>\n\n            <div class="card__action-bar dashboard-card-action a">\n                <span class="card-action" v-on:click="goto(section.link)">View</span>\n            </div>\n          </div>\n          </div>\n\n        </div>\n        </div>\n\n      </div>\n\n      </div>\n    ',
	    data: function data() {
	      return {
	        sections: [{
	          name: "Heatmap",
	          subtitle: "test",
	          desc: "Lorem impsum",
	          link: '/heatmap',
	          bg: '/images/heatmap.png'
	        }, {
	          name: "Customer map",
	          subtitle: "V",
	          desc: "View customer locations in real time",
	          link: '/pingmap',
	          bg: '/images/customer-map.png'
	        }]
	      };
	    },

	    methods: {
	      goto: function goto(name) {
	        store$1.set('router', name);
	      },
	      getBg: function getBg(bg) {
	        console.log('bgbgbgbg', bg);
	        return 'url(' + bg + ')';
	      }
	    }
	  });

	  return dashboard;
	};

	var dashboard$1 = dashboard();

	var modal = function modal() {
	  'use strict';

	  var startX = void 0;
	  var startY = void 0;

	  var modal = Vue.component('modal', {
	    template: '<transition name="modal">\n        <div class="modal-mask">\n          <div class="modal-wrapper">\n            <div class="modal-container" draggable="true" v-on:drag="dragAction($event)"  v-on:dragstart="dragStart($event)">\n            <div class="card card--big"  >\n              <div style="background-image: url(/images/bg-outwear-xs.jpg)" class="card__image"></div>\n              <h2 class="card__title">{{section.name}}</h2>\n              <span class="card__subtitle">{{section.subtitle}}</span>\n              <p class="card__text">{{section.desc}}<br>\n                <span class="card-action"  @click="$emit(\'close\')">Close</span>\n                <slot name="body"></slot>\n              </p>\n\n              <div class="card__action-bar">\n                <ul class="list-item-list">\n                <li class="list-item">\n                  <span class="avatar"><img class="avatar-image" src="/images/jacket.png"></span>\n                  <span class="name">Jacket 100e</span>\n                </li>\n                <li class="list-item">\n                    <span class="avatar"><img class="avatar-image"  src="/images/jacket.png"></span>\n                    <span class="name">Jacket 100e</span>\n                </li>\n                <li class="list-item">\n                    <span class="avatar"><img class="avatar-image"  src="/images/jacket.png"></span>\n                    <span class="name">Jacket 100e</span>\n                </li>\n                </ul>\n              </div>\n            </div>\n            </div>\n          </div>\n        </div>\n      </transition>',
	    data: function data() {
	      return {
	        section: {
	          name: 'Clothing',
	          subtitle: 'Outwear',
	          desc: "Outdoor wear and clothing"
	        }
	      };
	    },

	    methods: {
	      handleImageDrop: function handleImageDrop() {
	        console.log('DROP');
	      },
	      dragStart: function dragStart(event) {
	        startX = event.screenX;
	        startY = event.screenY;
	      },
	      dragAction: function dragAction(event) {
	        //if(event.screenX !==  startX && event.screenY !== event.screenY)
	        //    event.target.style.transform = `translate(${event.offsetX}px, ${event.offsetY}px)`;
	        console.log(event);
	      }
	    },
	    mounted: function mounted() {
	      store$1.listen('modal', function () {
	        console.log('MODALMODALMMODAL');
	      });
	    }
	  });

	  return modal;
	};

	modal();

	function interopDefault(ex) {
		return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	};

	var asyncGenerator = function () {
	  function AwaitValue(value) {
	    this.value = value;
	  }

	  function AsyncGenerator(gen) {
	    var front, back;

	    function send(key, arg) {
	      return new Promise(function (resolve, reject) {
	        var request = {
	          key: key,
	          arg: arg,
	          resolve: resolve,
	          reject: reject,
	          next: null
	        };

	        if (back) {
	          back = back.next = request;
	        } else {
	          front = back = request;
	          resume(key, arg);
	        }
	      });
	    }

	    function resume(key, arg) {
	      try {
	        var result = gen[key](arg);
	        var value = result.value;

	        if (value instanceof AwaitValue) {
	          Promise.resolve(value.value).then(function (arg) {
	            resume("next", arg);
	          }, function (arg) {
	            resume("throw", arg);
	          });
	        } else {
	          settle(result.done ? "return" : "normal", result.value);
	        }
	      } catch (err) {
	        settle("throw", err);
	      }
	    }

	    function settle(type, value) {
	      switch (type) {
	        case "return":
	          front.resolve({
	            value: value,
	            done: true
	          });
	          break;

	        case "throw":
	          front.reject(value);
	          break;

	        default:
	          front.resolve({
	            value: value,
	            done: false
	          });
	          break;
	      }

	      front = front.next;

	      if (front) {
	        resume(front.key, front.arg);
	      } else {
	        back = null;
	      }
	    }

	    this._invoke = send;

	    if (typeof gen.return !== "function") {
	      this.return = undefined;
	    }
	  }

	  if (typeof Symbol === "function" && Symbol.asyncIterator) {
	    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
	      return this;
	    };
	  }

	  AsyncGenerator.prototype.next = function (arg) {
	    return this._invoke("next", arg);
	  };

	  AsyncGenerator.prototype.throw = function (arg) {
	    return this._invoke("throw", arg);
	  };

	  AsyncGenerator.prototype.return = function (arg) {
	    return this._invoke("return", arg);
	  };

	  return {
	    wrap: function (fn) {
	      return function () {
	        return new AsyncGenerator(fn.apply(this, arguments));
	      };
	    },
	    await: function (value) {
	      return new AwaitValue(value);
	    }
	  };
	}();

	var vue_dragAndDrop = createCommonjsModule(function (module, exports) {
	  /* globals Vue */
	  (function () {

	    var DragAndDrop = {};

	    DragAndDrop.install = function (Vue) {
	      Vue.directive('drag-and-drop', {
	        params: ['drag-and-drop', 'drag-start', 'drag', 'drag-over', 'drag-enter', 'drag-leave', 'drag-end', 'drop', 'draggable', 'droppable'],
	        bind: function bind() {
	          // use the VM so we only have 1 dragging item per app
	          this.vm._dragSrcEl = null;

	          if (this.params.draggable === undefined) {
	            this.params.draggable = true;
	          }
	          if (this.params.droppable === undefined) {
	            this.params.droppable = true;
	          }
	          // transfer "false" => false, "true" => true
	          var blooeanMaps = {
	            true: true,
	            false: false
	          };

	          var draggable = blooeanMaps[this.params.draggable];
	          var droppable = blooeanMaps[this.params.droppable];
	          var emptyFn = function emptyFn() {};

	          this.handleDragStart = function (e) {
	            e.target.classList.add('dragging');
	            this.vm._dragSrcEl = e.target;
	            e.dataTransfer.effectAllowed = 'move';
	            // Need to set to something or else drag doesn't start
	            e.dataTransfer.setData('text', '*');
	            if (typeof this.vm[this.params.dragStart] === 'function') {
	              this.vm[this.params.dragStart].call(this, e.target, e);
	            }
	          }.bind(this);
	          this.handleDragOver = function (e) {
	            if (e.preventDefault) {
	              // allows dropping
	              e.preventDefault();
	            }
	            e.dataTransfer.dropEffect = 'move';
	            e.target.classList.add('drag-over');
	            if (typeof this.vm[this.params.dragOver] === 'function') {
	              this.vm[this.params.dragOver].call(this, e.target, e);
	            }
	            return false;
	          }.bind(this);
	          this.handleDragEnter = function (e) {
	            if (typeof this.vm[this.params.dragEnter] === 'function') {
	              this.vm[this.params.dragEnter].call(this, e.target, e);
	            }
	            e.target.classList.add('drag-enter');
	          }.bind(this);
	          this.handleDragLeave = function (e) {
	            if (typeof this.vm[this.params.dragLeave] === 'function') {
	              this.vm[this.params.dragLeave].call(this, e.target, e);
	            }
	            e.target.classList.remove('drag-enter');
	          }.bind(this);
	          this.handleDrag = function (e) {
	            if (typeof this.vm[this.params.drag] === 'function') {
	              this.vm[this.params.drag].call(this, e.target, e);
	            }
	          }.bind(this);
	          this.handleDragEnd = function (e) {
	            e.target.classList.remove('dragging', 'drag-over', 'drag-enter');
	            if (typeof this.vm[this.params.dragEnd] === 'function') {
	              this.vm[this.params.dragEnd].call(this, e.target, e);
	            }
	          }.bind(this);
	          this.handleDrop = function (e) {
	            e.preventDefault();
	            if (e.stopPropagation) {
	              // stops the browser from redirecting.
	              e.stopPropagation();
	            }
	            // Don't do anything if dropping the same column we're dragging.
	            if (this.vm._dragSrcEl != e.target) {
	              if (typeof this.vm[this.params.drop] === 'function') {
	                var el = e.target.draggable || draggable ? e.target : e.target.parentElement;
	                this.vm[this.params.drop].call(this, this.vm._dragSrcEl, el, e);
	              }
	            }
	            return false;
	          }.bind(this);

	          if (!draggable) {
	            this.handleDragStart = emptyFn;
	            this.handleDragEnter = emptyFn;
	            this.handleDrag = emptyFn;
	            this.handleDragLeave = emptyFn;
	            this.handleDragEnd = emptyFn;
	          }
	          if (!droppable) {
	            this.handleDrop = emptyFn;
	          }
	          // setup the listeners
	          draggable && this.el.setAttribute('draggable', 'true');
	          this.el.addEventListener('dragstart', this.handleDragStart, false);
	          this.el.addEventListener('dragenter', this.handleDragEnter, false);
	          this.el.addEventListener('dragover', this.handleDragOver, false);
	          this.el.addEventListener('drag', this.handleDrag, false);
	          this.el.addEventListener('dragleave', this.handleDragLeave, false);
	          this.el.addEventListener('dragend', this.handleDragEnd, false);
	          this.el.addEventListener('drop', this.handleDrop, false);
	        },
	        update: function update(newValue, oldValue) {
	          // console.log(this);
	        },
	        unbind: function unbind() {
	          // shut er' down
	          this.el.classList.remove('dragging', 'drag-over', 'drag-enter');
	          this.el.removeAttribute('draggable');
	          this.el.removeEventListener('dragstart', this.handleDragStart);
	          this.el.removeEventListener('dragenter', this.handleDragEnter);
	          this.el.removeEventListener('dragover', this.handleDragOver);
	          this.el.removeEventListener('dragleave', this.handleDragLeave);
	          this.el.removeEventListener('drag', this.handleDrag);
	        }
	      });
	    };

	    if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) == "object") {
	      module.exports = DragAndDrop;
	    } else if (typeof define == "function" && define.amd) {
	      define([], function () {
	        return DragAndDrop;
	      });
	    } else if (window.Vue) {
	      window.DragAndDrop = DragAndDrop;
	      Vue.use(DragAndDrop);
	    }
	  })();
	});

	interopDefault(vue_dragAndDrop);

	var routes = [{ path: '/dashboard', component: dashboard$1 }, { path: '/heatmap', component: heatmap$1 }, { path: '/pingmap', component: pingmap$1 }, { path: '/profile', component: profile }];
	var router = new VueRouter({
	  routes: routes //
	});

	var instance = new Vue({
	  router: router,
	  mounted: function mounted() {
	    var _this = this;

	    store$1.listen('modal', function (show) {
	      _this.showModal = !_this.showModal;
	    });
	    store$1.listen('router', function (name) {
	      router.push(name);
	    });
	  },

	  data: {
	    showModal: false
	  }
	});

	instance.$mount('#app');

	//toast.make('User needs help', 'Dismiss');
	//unpin_user
	//

	// ( function() {
	//   http.get("http://40.113.85.15/cashmesh?get_active_tickets")
	//   .then((_data) => {
	//     console.log(_data);
	//   })
	//   .catch((err) => {
	//     console.warn(err);
	//   })
	// })();

	(function () {

	  window.setUnpinned = function () {

	    _export.get("http://40.113.85.15/cashmesh?unpin_user=2").then(function (_data) {
	      console.log(_data);
	    }).catch(function (err) {
	      console.warn(err);
	    });
	  };
	})();

	/**
	* Module
	*/
	var app = function app() {
	  'use strict';

	  var app = {};
	  return app;
	};

	(function () {

	  var collapse = document.querySelector('.navbar-collapse');
	  var links = document.querySelector('.router-link');

	  document.querySelector('#toggle-collapse').addEventListener('click', function (event) {
	    collapse.classList.toggle('collapse');
	  });

	  collapse.addEventListener('click', function () {
	    if (window.innerWidth < 767) {
	      collapse.classList.toggle('collapse');
	    }
	  });

	  window.addEventListener('resize', function () {
	    store$1.set('resize', true);
	  });
	})();

	var index = app();

	return index;

}());