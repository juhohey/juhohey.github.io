var cashmesh = (function () {
  /**
  * Scroll to element
  * @version 1.0
  * @usage - put scroll attr to an element
  * @listener 'scroll-to' on _id
  */
  /**
  * Module
  */
  var scrollTo = function scrollTo() {
    'use strict';

    var scrollTo = {};

    var OFFSET = 0;

    scrollTo.scroll = function (element, offset) {
      offset = offset || 0;
      var amount = getScrollVal(element);
      var speed = amount < 500 ? 10000 : 2000;
      scrollToX(amount - offset, speed);
    };

    scrollTo.attach = function (offset) {
      OFFSET = offset;
      attach();
    };

    function attach(offset) {

      var selector = "[scroll-to]";
      var elements = document.querySelectorAll(selector);
      if (!elements) return;
      for (var i = 0; i < elements.length; i++) {
        elements[i].addEventListener('click', listener);
      }
    }

    function listener(event) {
      event.preventDefault();
      var target = event.currentTarget.getAttribute('href');
      scrollTo.scroll(document.querySelector(target), OFFSET);
    }

    function getScrollVal(e) {
      var parent = e.offsetParent;
      var o = e.offsetTop;
      while (parent) {
        o += parent.offsetTop;
        parent = parent.offsetParent;
      }
      return o;
    }

    function scrollToX(scrollTargetY, speed, easing) {
      // scrollTargetY: the target scrollY property of the window
      // speed: time in pixels per second
      // easing: easing equation to use

      var scrollY = window.scrollY,
          scrollTargetY = scrollTargetY || 0,
          speed = speed || 2000,
          easing = easing || 'easeInOutQuint',
          currentTime = 0;

      // min time .1, max time .8 seconds
      var time = Math.max(.1, Math.min(Math.abs(scrollY - scrollTargetY) / speed, .8));

      // easing equations from https://github.com/danro/easing-js/blob/master/easing.js
      var PI_D2 = Math.PI / 2,
          easingEquations = {
        easeOutSine: function easeOutSine(pos) {
          return Math.sin(pos * (Math.PI / 2));
        },
        easeInOutSine: function easeInOutSine(pos) {
          return -0.5 * (Math.cos(Math.PI * pos) - 1);
        },
        easeInOutQuint: function easeInOutQuint(pos) {
          if ((pos /= 0.5) < 1) {
            return 0.5 * Math.pow(pos, 5);
          }
          return 0.5 * (Math.pow(pos - 2, 5) + 2);
        }
      };

      // add animation loop
      function tick() {
        currentTime += 1 / 60;

        var p = currentTime / time;
        var t = easingEquations[easing](p);

        if (p < 1) {
          requestAnimationFrame(tick);

          window.scrollTo(0, parseInt(scrollY + (scrollTargetY - scrollY) * t));
        } else {

          window.scrollTo(0, scrollTargetY);
        }
      }
      // call it once to get started
      tick();
    }

    return scrollTo;
  };

  var scroll = scrollTo();

  var c = document.getElementById("cash");
  var ctx = c.getContext("2d");
  var cH;
  var cW;
  var bgColor = "#FF6138";
  var animations = [];
  var colorPicker = function () {
    var colors = ["#FF6633", "#45CCFF", "#FF3300", "#FFD432"];
    var index = 0;
    function next() {
      index = index++ < colors.length - 1 ? index : 0;
      return colors[index];
    }
    function current() {
      return colors[index];
    }
    return {
      next: next,
      current: current
    };
  }();

  function removeAnimation(animation) {
    var index = animations.indexOf(animation);
    if (index > -1) animations.splice(index, 1);
  }

  function calcPageFillRadius(x, y) {
    var l = Math.max(x - 0, cW - x);
    var h = Math.max(y - 0, cH - y);
    return Math.sqrt(Math.pow(l, 2) + Math.pow(h, 2));
  }

  function addClickListeners() {
    document.addEventListener("touchstart", handleEvent);
    document.addEventListener("mousedown", handleEvent);
  };

  function handleEvent(e) {
    if (e.touches) {
      e.preventDefault();
      e = e.touches[0];
    }
    var currentColor = colorPicker.current();
    var nextColor = colorPicker.next();
    var targetR = calcPageFillRadius(e.pageX, e.pageY);
    var rippleSize = Math.min(200, cW * .4);
    var minCoverDuration = 750;

    var pageFill = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: nextColor
    });
    var fillAnimation = anime({
      targets: pageFill,
      r: targetR,
      duration: Math.max(targetR / 2, minCoverDuration),
      easing: "easeOutQuart",
      complete: function complete() {
        bgColor = pageFill.fill;
        removeAnimation(fillAnimation);
      }
    });

    var ripple = new Circle({
      x: e.pageX,
      y: e.pageY,
      r: 0,
      fill: currentColor,
      stroke: {
        width: 3,
        color: currentColor
      },
      opacity: 1
    });
    var rippleAnimation = anime({
      targets: ripple,
      r: rippleSize,
      opacity: 0,
      easing: "easeOutExpo",
      duration: 900,
      complete: removeAnimation
    });

    var particles = [];
    for (var i = 0; i < 32; i++) {
      var particle = new Circle({
        x: e.pageX,
        y: e.pageY,
        fill: currentColor,
        r: anime.random(24, 48)
      });
      particles.push(particle);
    }
    var particlesAnimation = anime({
      targets: particles,
      x: function x(particle) {
        return particle.x + anime.random(rippleSize, -rippleSize);
      },
      y: function y(particle) {
        return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
      },
      r: 0,
      easing: "easeOutExpo",
      duration: anime.random(1000, 1300),
      complete: removeAnimation
    });
    animations.push(fillAnimation, rippleAnimation, particlesAnimation);
  }

  function extend(a, b) {
    for (var key in b) {
      if (b.hasOwnProperty(key)) {
        a[key] = b[key];
      }
    }
    return a;
  }

  var Circle = function Circle(opts) {
    extend(this, opts);
  };

  Circle.prototype.draw = function () {
    ctx.globalAlpha = this.opacity || 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    if (this.stroke) {
      ctx.strokeStyle = this.stroke.color;
      ctx.lineWidth = this.stroke.width;
      ctx.stroke();
    }
    if (this.fill) {
      ctx.fillStyle = this.fill;
      ctx.fill();
    }
    ctx.closePath();
    ctx.globalAlpha = 1;
  };

  var animate = anime({
    duration: Infinity,
    update: function update() {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, cW, cH);
      animations.forEach(function (anim) {
        anim.animatables.forEach(function (animatable) {
          animatable.target.draw();
        });
      });
    }
  });

  var resizeCanvas = function resizeCanvas() {
    cW = window.innerWidth;
    cH = window.innerHeight;
    c.width = cW * devicePixelRatio;
    c.height = cH * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  };

  (function init() {
    resizeCanvas();
    if (window.CP) {
      // CodePen's loop detection was causin' problems
      // and I have no idea why, so...
      window.CP.PenTimer.MAX_TIME_IN_LOOP_WO_EXIT = 6000;
    }
    window.addEventListener("resize", resizeCanvas);
    addClickListeners();
    if (!!window.location.pathname.match(/fullcpgrid/)) {
      startFauxClicking();
    }
    handleInactiveUser();
  })();

  function handleInactiveUser() {
    var inactive = setTimeout(function () {
      fauxClick(cW / 2, cH / 2);
    }, 2000);

    function clearInactiveTimeout() {
      clearTimeout(inactive);
      document.removeEventListener("mousedown", clearInactiveTimeout);
      document.removeEventListener("touchstart", clearInactiveTimeout);
    }

    document.addEventListener("mousedown", clearInactiveTimeout);
    document.addEventListener("touchstart", clearInactiveTimeout);
  }

  function startFauxClicking() {
    setTimeout(function () {
      fauxClick(anime.random(cW * .2, cW * .8), anime.random(cH * .2, cH * .8));
      startFauxClicking();
    }, anime.random(200, 900));
  }

  function fauxClick(x, y) {
    var fauxClick = new Event("mousedown");
    fauxClick.pageX = x;
    fauxClick.pageY = y;
    document.dispatchEvent(fauxClick);
  }

  var app = function app() {

    var app = {};

    app.log = function () {
      console.log("Hello world");
    };

    scroll.attach();

    return app;
  };

  var app$1 = app();

  return app$1;

}());