var _createClass = function() {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor)
                    }
                }
                return function(Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor
                }
            } ();
            function _classCallCheck(instance, Constructor) {
                if (! (instance instanceof Constructor)) {
                    throw new TypeError("Cannot call a class as a function");
                }
            }
            var tools = {
                drawPath: function drawPath(ctx, fn) {
                    ctx.save();
                    ctx.beginPath();
                    fn();
                    ctx.closePath();
                    ctx.restore()
                },
                random: function random(min, max, int) {
                    var result = min + Math.random() * (max + (int ? 1 : 0) - min);
                    return int ? parseInt(result) : result
                },
                getVectorLength: function getVectorLength(p1, p2) {
                    return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2))
                },
                easing: function easing(t, b, c, d, s) {
                    return c * ((t = t / d - 1) * t * t + 1) + b
                },
                cellEasing: function cellEasing(t, b, c, d, s) {
                    return c * (t /= d) * t * t * t + b
                }
            };
            var doc = {
                height: 0,
                width: 0
            };
            var plane = {
                xCell: 0,
                yCell: 0,
                cells: []
            };
            var context = {
                plane: null,
                main: null
            };
            var mouse = {
                x: 0,
                y: 0,
                coords: {
                    x: 0,
                    y: 0
                },
                down: {
                    state: false,
                    x: 0,
                    y: 0
                }
            };
            var cfg = {
                cell: 35,
                sectionWidth: 8,
                sectionHeight: 1,
                numberOffset: 5,
                shadowBlur: true,
                bgColor: '#181818'
            };
            var ui = {
                plane: '#plane-canvas',
                main: '#main-canvas',
                textNodes: '[data-js=text]',
                social: '#social',
                mouse: '#mouse'
            };
            var App = function() {
                function App() {
                    _classCallCheck(this, App);
                    this.state = {
                        area: 0,
                        time: Date.now(),
                        lt: 0,
                        planeProgress: 0,
                        dotsProgress: 0,
                        fadeInProgress: 0,
                        textProgress: 0,
                        stepOffset: 0,
                        textOffset: 0,
                        markupOffset: 0,
                        glitches: [],
                        animLines: [],
                        animNumbers: [],
                        tabIsActive: true,
                        planeIsDrawn: false,
                        mousePower: 0,
                        textPixelData: [],
                        text: {},
                        delta: 0,
                        dlt: performance.now(),
                        needRedraw: true
                    };
                    this.bindNodes();
                    this.getDimensions();
                    mouse.x = doc.width / 2;
                    mouse.y = doc.height / 2;
                    this.start()
                }
                _createClass(App, [{
                    key: 'start',
                    value: function start() {
                        this.initEvents();
                        this.canvasInit();
                        this.loop();
                        this.initCheckingInterval();
                        this.splitText()
                    }
                },
                {
                    key: 'splitText',
                    value: function splitText() {
                        ui.textNodes.forEach(function(el) {
                            var value = el.innerText;
                            el.innerHTML = value.split('').reduce(function(acc, cur) {
                                return acc + ('<span class="letter">' + cur + '</span>')
                            },
                            '')
                        })
                    }
                },
                {
                    key: 'animateText',
                    value: function animateText() {
                        var callback = function callback() {
                            ui.social.classList.add('active');
                            ui.mouse.classList.add('active')
                        };
                        ui.textNodes.forEach(function(el, elIndex) {
                            el.classList.add('active');
                            var letters = el.querySelectorAll('.letter');
                            var length = Math.round(letters.length / 2) + 1;
                            var _loop = function _loop(i) {
                                var letter1 = letters[i];
                                var letter2 = letters[letters.length - i];
                                setTimeout(function() {
                                    if (letter1) letter1.classList.add('active');
                                    if (letter2) letter2.classList.add('active');
                                    if (i === length - 1 && elIndex === ui.textNodes.length - 1) callback()
                                },
                                i * 100)
                            };
                            for (var i = 0; i < length; i++) {
                                _loop(i)
                            }
                        })
                    }
                },
                {
                    key: 'getDimensions',
                    value: function getDimensions() {
                        doc.height = document.documentElement.clientHeight;
                        doc.width = document.documentElement.clientWidth
                    }
                },
                {
                    key: 'updatePlane',
                    value: function updatePlane() {
                        var w = doc.width,
                        h = doc.height;
                        var cell = Math.round(w / cfg.cell);
                        var xPreSize = w / cell;
                        plane.xCell = w / xPreSize % 2 !== 0 ? w / (w / xPreSize + 1) : xPreSize;
                        var yPreSize = h / Math.round(cell * (h / w));
                        plane.yCell = h / yPreSize % 2 !== 0 ? h / (h / yPreSize + 1) : yPreSize;
                        plane.cells = [Math.round(w / plane.xCell), Math.round(h / plane.yCell)];
                        plane.xCenter = Math.round(plane.cells[1] / 2);
                        plane.yCenter = Math.round(plane.cells[0] / 2);
                        plane.centerCoords = [plane.yCenter * plane.xCell, plane.xCenter * plane.yCell]
                    }
                },
                {
                    key: 'bindNodes',
                    value: function bindNodes() {
                        for (var selector in ui) {
                            ui[selector] = document.querySelectorAll(ui[selector]);
                            if (ui[selector].length === 1) ui[selector] = ui[selector][0]
                        }
                    }
                },
                {
                    key: 'canvasInit',
                    value: function canvasInit() {
                        var font = '10px Montserrat';
                        var lineCapAndJoin = 'round';
                        var color = 'rgba(15, 255, 0,0.1)';
                        context.plane = ui.plane.getContext('2d');
                        context.plane.lineCap = lineCapAndJoin;
                        context.plane.lineJoin = lineCapAndJoin;
                        context.plane.font = font;
                        context.plane.fillStyle = color;
                        context.plane.strokeStyle = color;
                        context.main = ui.main.getContext('2d');
                        context.main.lineCap = lineCapAndJoin;
                        context.main.lineJoin = lineCapAndJoin;
                        context.main.font = font;
                        context.main.fillStyle = color;
                        context.main.strokeStyle = color;
                        this.getTextPixels()
                    }
                },
                {
                    key: 'initEvents',
                    value: function initEvents() {
                        var _this = this;
                        window.addEventListener('resize',
                        function(e) {
                            _this.getDimensions();
                            _this.resizeHandler(e)
                        });
                        document.addEventListener('mousemove',
                        function(e) {
                            mouse.x = e.clientX;
                            mouse.y = e.clientY;
                            mouse.coords = {
                                x: (mouse.x / doc.width - 0.5) / 0.5,
                                y: (mouse.y / doc.height - 0.5) / 0.5 * -1
                            }
                        });
                        document.addEventListener('mousedown',
                        function(e) {
                            mouse.down = {
                                state: true,
                                x: e.clientX,
                                y: e.clientY
                            }
                        });
                        document.addEventListener('mouseup',
                        function(e) {
                            mouse.down.state = false
                        });
                        document.addEventListener('contextmenu',
                        function(e) {
                            e.preventDefault()
                        });
                        this.resizeHandler()
                    }
                },
                {
                    key: 'resizeHandler',
                    value: function resizeHandler(e) {
                        var state = this.state;
                        ui.main.height = doc.height;
                        ui.main.width = doc.width;
                        ui.plane.height = doc.height;
                        ui.plane.width = doc.width;
                        state.area = doc.width * doc.height / 1000000;
                        this.updatePlane();
                        this.updateTextConfig();
                        if (state.planeIsDrawn) this.getTextPixels();
                        state.needRedraw = true
                    }
                },
                {
                    key: 'updateTextConfig',
                    value: function updateTextConfig() {
                        var state = this.state;
                        state.text = {
                            baseLine: 'top',
                            font: '800 270px Montserrat',
                            value: '榛戝甯濆浗'
                        }
                    }
                },
                {
                    key: 'initCheckingInterval',
                    value: function initCheckingInterval() {
                        var state = this.state;
                        setInterval(function() {
                            state.tabIsActive = state.time <= state.lt ? false: true;
                            state.lt = state.time;
                            state.needRedraw = !state.tabIsActive
                        },
                        100)
                    }
                },
                {
                    key: 'loop',
                    value: function loop() {
                        var _this2 = this;
                        var loop = function loop() {
                            var ctx = context.main;
                            var state = _this2.state;
                            state.time = Date.now();
                            ctx.clearRect(0, 0, doc.width, doc.height);
                            _this2.updateState();
                            _this2.draw();
                            if (state.needRedraw) state.needRedraw = false;
                            _this2.raf = requestAnimationFrame(loop)
                        };
                        loop()
                    }
                },
                {
                    key: 'updateState',
                    value: function updateState() {
                        var state = this.state;
                        var now = performance.now();
                        state.delta = now - state.dlt;
                        state.dlt = now;
                        var dt = state.delta;
                        if (mouse.down.state) {
                            state.mousePower += +0.001 * dt;
                            if (state.mousePower >= 1) {
                                state.mousePower = 1;
                                ui.mouse.classList.remove('active')
                            }
                        } else {
                            state.mousePower -= 0.001 * dt;
                            if (state.mousePower <= 0) state.mousePower = 0
                        }
                        var mp = tools.cellEasing(state.mousePower, 0, 1, 1);
                        if (state.planeProgress >= 0.2) {
                            state.dotsProgress += 0.00035 * dt;
                            if (state.dotsProgress >= 1) state.dotsProgress = 1
                        }
                        state.planeProgress += 0.00035 * dt;
                        if (state.planeProgress >= 1) state.planeProgress = 1;
                        if (state.planeIsDrawn) {
                            state.fadeInProgress += 0.00015 * dt;
                            if (state.fadeInProgress >= 1) state.fadeInProgress = 1;
                            state.stepOffset += 0.002 * dt + mp * (0.0035 * dt);
                            state.textOffset += 0.00005 * dt + mp * (0.002 * dt);
                            state.markupOffset += 0.00015 * dt + mp * (0.00035 * dt);
                            state.textProgress += 0.0005 * dt;
                            if (state.textProgress >= 1) state.textProgress = 1
                        }
                    }
                },
                {
                    key: 'getTextPixels',
                    value: function getTextPixels() {
                        var ctx = context.main;
                        var state = this.state;
                        var xCell = plane.xCell,
                        yCell = plane.yCell;
                        tools.drawPath(ctx,
                        function() {
                            ctx.fillStyle = 'chartreuse';
                            ctx.textBaseline = state.text.baseLine;
                            ctx.font = state.text.font;
                            var text = state.text.value;
                            var h = parseInt(ctx.font);
                            var w = ctx.measureText(text).width;
                            var x = doc.width / 2 - w / 2;
                            var y = yCell * 1.75;
                            ctx.fillText(text, x, y)
                        });
                        var imageData = ctx.getImageData(0, 0, doc.width, doc.height).data;
                        state.textPixelData = [];
                        var offset = 10;
                        for (var h = 0; h < doc.height; h += offset) {
                            for (var w = 0; w < doc.width; w += offset) {
                                var pixel = imageData[(w + h * doc.width) * 4 - 1];
                                if (pixel == 255) state.textPixelData.push({
                                    x: w,
                                    y: h,
                                    value: tools.random(0, 1, true)
                                })
                            }
                        }
                        ctx.clearRect(0, 0, doc.width, doc.height)
                    }
                },
                {
                    key: 'drawText',
                    value: function drawText() {
                        var yCell = plane.yCell;
                        var ctx = context.main;
                        var state = this.state;
                        var p = state.textOffset;
                        var mp = tools.cellEasing(state.mousePower, 0, 1, 1);
                        var length = state.textPixelData.length;
                        tools.drawPath(ctx,
                        function() {
                            if (cfg.shadowBlur) {
                                ctx.shadowColor = 'rgba(15, 255, 0,0.025)';
                                ctx.shadowBlur = 30 * state.mousePower
                            }
                            ctx.globalAlpha = state.fadeInProgress * 0.95;
                            ctx.textBaseline = state.text.baseLine;
                            ctx.fillStyle = cfg.bgColor;
                            ctx.font = state.text.font;
                            var text = state.text.value;
                            var x = doc.width / 2 - ctx.measureText(text).width / 2;
                            var y = yCell * 1.75;
                            ctx.fillText(text, x, y)
                        });
                        var _loop2 = function _loop2(i) {
                            var pixel = state.textPixelData[i];
                            var even = i % 2 === 0 ? 1 : -1;
                            var x = pixel.x,
                            y = pixel.y,
                            value = pixel.value;
                            var uniq = i;
                            var x2 = (3 + mp * 50) * Math.sin(p * uniq);
                            var y2 = (10 + mp * 50) * Math.cos(p * uniq);
                            var per = (1 - mp) * (i / length);
                            tools.drawPath(ctx,
                            function() {
                                if (!per) return;
                                ctx.globalAlpha = state.fadeInProgress;
                                ctx.font = '8px Montserrat';
                                ctx.fillStyle = 'rgba(15,255,0,' + per * 0.3 + ')';
                                if (i % 2 === 0) ctx.fillText(value + '', x, y + y2 * -1);
                                ctx.fillStyle = 'rgba(15,255,0,' + per + ')';
                                ctx.fillRect(x + x2, y, 5 * per * (1 - mp), 1);
                                ctx.fillRect(x, y + y2, 1, 5 * per * (1 - mp))
                            })
                        };
                        for (var i = 0; i < state.textPixelData.length; i++) {
                            _loop2(i)
                        }
                    }
                },
                {
                    key: 'draw',
                    value: function draw() {
                        var ctx = context.main;
                        var state = this.state;
                        var xCell = plane.xCell,
                        yCell = plane.yCell,
                        xCenter = plane.xCenter,
                        yCenter = plane.yCenter;
                        var cp = state.planeProgress;
                        if (this.state.planeProgress >= 1 && !state.planeIsDrawn) {
                            state.planeIsDrawn = true;
                            this.startGeneratingGlitches();
                            this.startGeneratingLines();
                            this.startGeneratingNumbers();
                            this.getTextPixels();
                            this.animateText()
                        }
                        if (!state.planeIsDrawn || state.dotsProgress < 1 || state.planeIsDrawn && state.needRedraw) {
                            this.drawPlane()
                        }
                        for (var i = 0; i * xCell < doc.width + xCell; i++) {
                            for (var i2 = 0; i2 * yCell < doc.height + yCell; i2++) {
                                var _x = i * xCell;
                                var _y = i2 * yCell;
                                if (state.planeIsDrawn) {
                                    this.drawMouseMoveInteraction({
                                        i: i,
                                        i2: i2,
                                        x: _x,
                                        y: _y
                                    });
                                    if (i2 === xCenter && i !== yCenter) {
                                        this.drawMarkupYAnimation({
                                            i: i,
                                            i2: i2,
                                            x: _x,
                                            y: _y,
                                            cp: cp
                                        })
                                    }
                                    if (i2 !== xCenter && i === yCenter) {
                                        this.drawMarkupXAnimation({
                                            i: i,
                                            i2: i2,
                                            x: _x,
                                            y: _y,
                                            cp: cp
                                        })
                                    }
                                }
                            }
                        }
                        if (state.planeIsDrawn) {
                            this.drawGlitches();
                            this.drawAnimLines();
                            this.drawNumbersAnimation();
                            this.drawText()
                        }
                    }
                },
                {
                    key: 'startGeneratingNumbers',
                    value: function startGeneratingNumbers() {
                        var state = this.state;
                        function generateItem() {
                            var cells = plane.cells,
                            xCell = plane.xCell,
                            yCell = plane.yCell;
                            var mp = state.mousePower;
                            var timeToNewItem = tools.random(1 + 50 * (1 - mp), 5 + 100 * (1 - mp)) / state.area;
                            var item = {
                                p: 0,
                                color: 'rgba(15, 255, 0,' + tools.random(0.01, 0.3) + ')',
                                blinks: Array(tools.random(0, 3, true)).fill(null).map(function(item) {
                                    return {
                                        at: tools.random(0, 1),
                                        dur: tools.random(0, 0.3)
                                    }
                                }),
                                pf: tools.random(0.00075, 0.01),
                                x: tools.random(0, cells[0], true) * xCell,
                                y: tools.random(0, cells[1], true) * yCell,
                                value: tools.random(0, 1, true)
                            };
                            if (state.tabIsActive) state.animNumbers.push(item);
                            setTimeout(generateItem, timeToNewItem)
                        }
                        generateItem()
                    }
                },
                {
                    key: 'drawNumbersAnimation',
                    value: function drawNumbersAnimation() {
                        var ctx = context.main;
                        var state = this.state;
                        var yCell = plane.yCell,
                        xCell = plane.xCell;
                        state.animNumbers.forEach(function(item, i) {
                            item.p += item.pf * state.delta;
                            var show = true;
                            item.blinks.forEach(function(blink) {
                                if (item.p >= blink.at && item.p <= blink.at + blink.dur) show = false
                            });
                            if (!show) return;
                            tools.drawPath(ctx,
                            function() {
                                if (cfg.shadowBlur) {
                                    ctx.shadowColor = 'chartreuse';
                                    ctx.shadowBlur = 10
                                }
                                ctx.globalAlpha = state.fadeInProgress;
                                ctx.textBaseline = 'top';
                                ctx.font = '18px Montserrat';
                                var th = parseInt(ctx.font) || 18;
                                var tw = ctx.measureText(item.value + '').width;
                                ctx.fillStyle = item.color;
                                ctx.fillText(item.value + '', item.x + xCell / 2 - tw / 2, item.y + yCell / 2 - th / 2)
                            });
                            if (item.p >= 1) state.animNumbers.splice(i, 1)
                        })
                    }
                },
                {
                    key: 'startGeneratingLines',
                    value: function startGeneratingLines() {
                        var state = this.state;
                        function generateItem() {
                            var cells = plane.cells,
                            xCell = plane.xCell,
                            yCell = plane.yCell;
                            var mp = state.mousePower;
                            var timeToNewItem = tools.random(25 + 80 * (1 - mp), 75 + 1200 * (1 - mp)) / state.area;
                            var item = {
                                p: 0,
                                color: tools.random(0, 0.15),
                                pf: tools.random(0.0005, 0.00125),
                                x: tools.random(0, cells[0], true) * xCell,
                                y: tools.random(0, cells[1], true) * yCell
                            };
                            item.coord = tools.random(0, 1, true) ? 'x': 'y';
                            item.length = tools.random(xCell * 2, state.area * xCell * 5);
                            item.dir = tools.random(0, 1, true) ? 1 : -1;
                            item.distance = item.length * tools.random(1, 2);
                            if (state.tabIsActive) state.animLines.push(item);
                            setTimeout(generateItem, timeToNewItem)
                        }
                        generateItem()
                    }
                },
                {
                    key: 'drawAnimLines',
                    value: function drawAnimLines() {
                        var ctx = context.main;
                        var state = this.state;
                        state.animLines.forEach(function(line, i) {
                            line.p += line.pf * state.delta;
                            var p = tools.easing(line.p, 0, 1, 1);
                            var p1 = p / 0.5;
                            var p2 = 1 - (p - 0.5) / 0.5;
                            var color = 'rgba(15, 255, 0,' + (0.1 + line.color * (p <= 0.5 ? p1: p2)) + ')';
                            var length = p <= 0.5 ? line.length * p1: line.length * p2;
                            var backwards = line.dir === -1;
                            var isX = line.coord === 'x';
                            var isY = line.coord === 'y';
                            var x = !isX ? 0 : backwards ? -(length - line.distance * p) : -line.distance * p;
                            var y = !isY ? 0 : backwards ? -(length - line.distance * p) : -line.distance * p;
                            tools.drawPath(ctx,
                            function() {
                                ctx.globalAlpha = state.fadeInProgress;
                                ctx.fillStyle = color;
                                ctx.fillRect(line.x + x + (isX && p <= 0.5 ? (line.length - length) * line.dir: 0), line.y + y + (isY && p <= 0.5 ? (line.length - length) * line.dir: 0), isX ? length: 1, isY ? length: 1)
                            });
                            if (line.p >= 1) state.animLines.splice(i, 1)
                        })
                    }
                },
                {
                    key: 'startGeneratingGlitches',
                    value: function startGeneratingGlitches() {
                        var state = this.state;
                        function generateItem() {
                            var cells = plane.cells,
                            xCell = plane.xCell,
                            yCell = plane.yCell;
                            var mp = state.mousePower;
                            var timeToNewItem = tools.random((5 + 100 * (1 - mp)) / state.area, (25 + 1200 * (1 - mp)) / state.area);
                            var item = {
                                p: 0,
                                color: 'rgba(15, 255, 0,' + tools.random(0.01, 1) + ')',
                                blinks: Array(tools.random(0, 3, true)).fill(null).map(function(blink) {
                                    return {
                                        at: tools.random(0, 1),
                                        dur: tools.random(0, 0.3)
                                    }
                                }),
                                pf: tools.random(0.0015, 0.0035),
                                x: tools.random(0, cells[0], true) * xCell,
                                y: tools.random(0, cells[1], true) * yCell,
                                width: xCell,
                                height: yCell
                            };
                            if (state.tabIsActive) state.glitches.push(item);
                            setTimeout(generateItem, timeToNewItem)
                        }
                        generateItem()
                    }
                },
                {
                    key: 'drawGlitches',
                    value: function drawGlitches() {
                        var ctx = context.main;
                        var state = this.state;
                        state.glitches.forEach(function(glitch, i) {
                            glitch.p += glitch.pf * state.delta;
                            var show = true;
                            glitch.blinks.forEach(function(blink) {
                                if (glitch.p >= blink.at && glitch.p <= blink.at + blink.dur) show = false
                            });
                            if (!show) return;
                            tools.drawPath(ctx,
                            function() {
                                if (cfg.shadowBlur) {
                                    ctx.shadowColor = 'chartreuse';
                                    ctx.shadowBlur = 30
                                }
                                ctx.globalAlpha = state.fadeInProgress;
                                ctx.fillStyle = glitch.color;
                                ctx.fillRect(glitch.x, glitch.y, glitch.width, glitch.height)
                            });
                            if (glitch.p >= 1) state.glitches.splice(i, 1)
                        })
                    }
                },
                {
                    key: 'drawMouseMoveInteraction',
                    value: function drawMouseMoveInteraction(props) {
                        var ctx = context.main;
                        var state = this.state;
                        var fp = state.fadeInProgress;
                        var sp = state.stepOffset;
                        var mp = state.mousePower;
                        var xCenter = plane.xCenter,
                        yCenter = plane.yCenter;
                        var i = props.i,
                        i2 = props.i2,
                        x = props.x,
                        y = props.y;
                        var position = [Math.abs(i2 - xCenter), Math.abs(i - yCenter)];
                        var mouseRange = (200 + 50 * mp) * (i * i2 % 2) * Math.sin(position[0] - position[1]);
                        if (mouseRange <= 100) return;
                        var vector = tools.getVectorLength([x, y], [mouse.x, mouse.y]);
                        if (vector <= mouseRange) {
                            var percent = (1 - vector / mouseRange) * fp;
                            var spinRadius = 50 * (1 - percent);
                            var xOffset = Math.sin(sp + i) * spinRadius * (Math.PI * 2 / 4) * ((i + i2) % 4 == 0 ? -1 : 1);
                            var yOffset = Math.cos(sp + i2) * spinRadius * (Math.PI * 2 / 4);
                            var sx = x + xOffset;
                            var sy = y + yOffset;
                            var radius = 25 * (1 - percent);
                            var lineWidth = 3 + 10 * percent;
                            var vector2 = tools.getVectorLength([sx, sy], [mouse.x, mouse.y]);
                            var p2 = 1 - vector2 / (mouseRange + spinRadius * 2);
                            var color = 'rgba(15,255,0,' + 0.3 * percent + ')';
                            var color2 = 'rgba(15,255,0,' + 0.7 * p2 * percent + ')';
                            tools.drawPath(ctx,
                            function() {
                                ctx.strokeStyle = color2;
                                ctx.moveTo(sx, sy);
                                ctx.lineTo(mouse.x, mouse.y);
                                ctx.stroke()
                            });
                            tools.drawPath(ctx,
                            function() {
                                ctx.strokeStyle = color2;
                                ctx.moveTo(x, y);
                                ctx.lineTo(sx, sy);
                                ctx.stroke()
                            });
                            tools.drawPath(ctx,
                            function() {
                                ctx.fillStyle = color;
                                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                                ctx.fill()
                            });
                            tools.drawPath(ctx,
                            function() {
                                ctx.strokeStyle = 'rgba(15,255,0,' + 0.5 * percent + ')';
                                ctx.lineWidth = 1 + 2 * (1 - percent);
                                ctx.arc(x, y, 3 + 10 * (1 - percent), 0, 2 * Math.PI);
                                ctx.stroke()
                            });
                            tools.drawPath(ctx,
                            function() {
                                ctx.fillStyle = 'rgba(15,255,0,' + percent + ')';
                                ctx.arc(sx, sy, 1, 0, 2 * Math.PI);
                                ctx.fill()
                            });
                            tools.drawPath(ctx,
                            function() {
                                if (cfg.shadowBlur) {
                                    ctx.shadowColor = 'chartreuse';
                                    ctx.shadowBlur = radius
                                }
                                ctx.lineWidth = lineWidth;
                                ctx.strokeStyle = 'rgba(15,255,0,' + 0.75 * percent + ')';
                                ctx.arc(sx, sy, radius, 0, 2 * Math.PI);
                                ctx.stroke()
                            })
                        }
                    }
                },
                {
                    key: 'drawPlaneDotsAnimation',
                    value: function drawPlaneDotsAnimation(props) {
                        var ctx = context.plane;
                        var dp = props.dp,
                        i = props.i,
                        i2 = props.i2,
                        x = props.x,
                        y = props.y;
                        var xCenter = plane.xCenter,
                        yCenter = plane.yCenter;
                        var position = [Math.abs(i2 - xCenter), Math.abs(i - yCenter)];
                        var index = position[0] * position[1];
                        var maxIndex = xCenter * yCenter;
                        var percent = 1 / maxIndex;
                        var point = percent * index;
                        var f = dp * (dp / point);
                        if (f >= 1) f = 1;
                        var mf = f >= 0.5 ? (1 - f) / 0.5 : f / 0.5;
                        var size = 3;
                        if (!mf) return;
                        tools.drawPath(ctx,
                        function() {
                            ctx.fillStyle = 'rgba(15,255,0,' + mf * 0.15 + ')';
                            ctx.fillRect(x - 1, y - 1, size, size)
                        })
                    }
                },
                {
                    key: 'drawPlaneCenterLines',
                    value: function drawPlaneCenterLines(props) {
                        var p = props.p;
                        var ctx = context.plane;
                        var centerCoords = plane.centerCoords;
                        tools.drawPath(ctx,
                        function() {
                            ctx.fillStyle = 'rgba(15,255,0,' + (0.2 + (1 - p) * 1) + ')';
                            ctx.fillRect(centerCoords[0], 0 + doc.height / 2 * (1 - p), 1, doc.height * p);
                            ctx.fillRect(0 + doc.width / 2 * (1 - p), centerCoords[1], doc.width * p, 1)
                        })
                    }
                },
                {
                    key: 'drawYLines',
                    value: function drawYLines(props) {
                        var i = props.i,
                        cp = props.cp,
                        p = props.p,
                        x = props.x;
                        var ctx = context.plane;
                        var yCenter = plane.yCenter;
                        var percent = 1 / yCenter;
                        var pos = Math.abs(i - yCenter);
                        var point = percent * pos;
                        var f = cp * (cp / point);
                        if (f >= 1) f = 1;
                        var ef = tools.cellEasing(f, 0, 1, 1);
                        if (i) {
                            tools.drawPath(ctx,
                            function() {
                                ctx.fillStyle = 'rgba(15,255,0,' + (0.05 + (1 - p) * 0.35) + ')';
                                ctx.fillRect(x, 0 + doc.height / 2 * (1 - ef), 1, doc.height * ef)
                            })
                        }
                    }
                },
                {
                    key: 'drawYMarkup',
                    value: function drawYMarkup(props) {
                        var ctx = context.plane;
                        var state = this.state;
                        var i = props.i,
                        p = props.p,
                        cp = props.cp,
                        x = props.x,
                        y = props.y;
                        var yCenter = plane.yCenter;
                        var percent = 1 / yCenter;
                        var pos = Math.abs(i - yCenter);
                        var point = percent * pos;
                        var conds = [p >= point, p <= point + percent];
                        var f = cp * (cp / point);
                        if (f >= 1) f = 1;
                        var f2 = conds[0] && conds[1] ? (p - point) / percent: conds[0] ? 1 : 0;
                        var text = i - yCenter + '';
                        ctx.fillStyle = 'rgba(15,255,0,' + (0.1 + (1 - f) * 0.75) + ')';
                        var textCoords = [x - ctx.measureText(text).width / 2, y + cfg.sectionWidth / 2 + cfg.numberOffset];
                        tools.drawPath(ctx,
                        function() {
                            var o = (1 - f2) * 50;
                            ctx.globalAlpha = f2;
                            ctx.fillRect(x, y - cfg.sectionWidth / 2 + o, cfg.sectionHeight, cfg.sectionWidth)
                        });
                        tools.drawPath(ctx,
                        function() {
                            ctx.globalAlpha = f2;
                            ctx.textBaseline = 'top';
                            ctx.fillText(text, textCoords[0], textCoords[1] + (1 - f2) * -20)
                        })
                    }
                },
                {
                    key: 'drawXLines',
                    value: function drawXLines(props) {
                        var ctx = context.plane;
                        var i2 = props.i2,
                        cp = props.cp,
                        p = props.p,
                        y = props.y;
                        var xCenter = plane.xCenter;
                        var percent = 1 / xCenter;
                        var pos = Math.abs(i2 - xCenter);
                        var point = percent * pos;
                        var f = cp * (cp / point);
                        if (f >= 1) f = 1;
                        var ef = tools.cellEasing(f, 0, 1, 1);
                        if (i2) {
                            tools.drawPath(ctx,
                            function() {
                                ctx.fillStyle = 'rgba(15,255,0,' + (0.05 + (1 - p) * 0.35) + ')';
                                ctx.fillRect(0 + doc.width / 2 * (1 - ef), y, doc.width * ef, 1)
                            })
                        }
                    }
                },
                {
                    key: 'drawXMarkup',
                    value: function drawXMarkup(props) {
                        var ctx = context.plane;
                        var state = this.state;
                        var i2 = props.i2,
                        p = props.p,
                        cp = props.cp,
                        x = props.x,
                        y = props.y;
                        var xCenter = plane.xCenter;
                        var percent = 1 / xCenter;
                        var pos = Math.abs(i2 - xCenter);
                        var point = percent * pos;
                        var conds = [p >= point, p <= point + percent];
                        var f = cp * (cp / point);
                        if (f >= 1) f = 1;
                        var f2 = conds[0] && conds[1] ? (p - point) / percent: conds[0] ? 1 : 0;
                        ctx.fillStyle = 'rgba(15,255,0,' + (0.1 + (1 - f) * 0.75) + ')';
                        tools.drawPath(ctx,
                        function() {
                            var o = (1 - f2) * 50;
                            ctx.globalAlpha = f2;
                            ctx.fillRect(x - cfg.sectionWidth / 2 + o, y, cfg.sectionWidth, cfg.sectionHeight)
                        });
                        tools.drawPath(ctx,
                        function() {
                            ctx.globalAlpha = f2;
                            ctx.textBaseline = 'middle';
                            var textCoords = [x + cfg.sectionWidth / 2 + cfg.numberOffset, y + cfg.sectionHeight / 2];
                            ctx.fillText(xCenter - i2 + '', textCoords[0] + (1 - f2) * -20, textCoords[1])
                        })
                    }
                },
                {
                    key: 'drawPlane',
                    value: function drawPlane() {
                        var state = this.state;
                        var ctx = context.plane;
                        ctx.clearRect(0, 0, doc.width, doc.height);
                        var xCell = plane.xCell,
                        yCell = plane.yCell,
                        xCenter = plane.xCenter,
                        yCenter = plane.yCenter;
                        var p = tools.easing(state.planeProgress, 0, 1, 1);
                        var cp = state.planeProgress;
                        var dp = state.dotsProgress;
                        this.drawPlaneCenterLines({
                            p: p
                        });
                        for (var i = 0; i * xCell < doc.width + xCell; i++) {
                            for (var i2 = 0; i2 * yCell < doc.height + yCell; i2++) {
                                var _x2 = i * xCell;
                                var _y2 = i2 * yCell;
                                if (i !== yCenter && i2 !== xCenter) {
                                    this.drawPlaneDotsAnimation({
                                        dp: dp,
                                        i: i,
                                        i2: i2,
                                        x: _x2,
                                        y: _y2
                                    })
                                }
                                if (i2 === xCenter && i !== yCenter) {
                                    this.drawYLines({
                                        i: i,
                                        i2: i2,
                                        p: p,
                                        cp: cp,
                                        x: _x2,
                                        y: _y2
                                    });
                                    this.drawYMarkup({
                                        i: i,
                                        p: p,
                                        cp: cp,
                                        x: _x2,
                                        y: _y2
                                    })
                                }
                                if (i2 !== xCenter && i === yCenter) {
                                    this.drawXLines({
                                        i: i,
                                        i2: i2,
                                        p: p,
                                        cp: cp,
                                        x: _x2,
                                        y: _y2
                                    });
                                    this.drawXMarkup({
                                        i2: i2,
                                        p: p,
                                        cp: cp,
                                        x: _x2,
                                        y: _y2
                                    })
                                }
                            }
                        }
                    }
                },
                {
                    key: 'drawMarkupYAnimation',
                    value: function drawMarkupYAnimation(props) {
                        var ctx = context.main;
                        var yCenter = plane.yCenter;
                        var i = props.i,
                        x = props.x,
                        y = props.y;
                        var state = this.state;
                        var spSin = Math.sin(state.markupOffset);
                        var sp = spSin >= 0 ? tools.cellEasing(Math.abs(spSin), 0, 1, 1) : 0;
                        var percent = 1 / yCenter;
                        var pos = Math.abs(i - yCenter);
                        var point = percent * pos;
                        var f = sp >= point && sp <= point + percent ? (sp - point) / percent: 0;
                        if (!f) return;
                        var text = i - yCenter + '';
                        ctx.fillStyle = 'rgba(15,255,0,' + (0.1 + (1 - f) * 0.75) + ')';
                        var textCoords = [x - ctx.measureText(text).width / 2, y + cfg.sectionWidth / 2 + cfg.numberOffset];
                        tools.drawPath(ctx,
                        function() {
                            ctx.fillStyle = 'rgba(15,255,0,' + f * 0.5 + ')';
                            ctx.fillRect(x, y - cfg.sectionWidth / 2, cfg.sectionHeight, cfg.sectionWidth)
                        });
                        tools.drawPath(ctx,
                        function() {
                            if (cfg.shadowBlur) {
                                ctx.shadowBlur = 5;
                                ctx.shadowColor = 'chartreuse'
                            }
                            ctx.fillStyle = 'rgba(15,255,0,' + f * 0.35 + ')';
                            ctx.textBaseline = 'top';
                            ctx.fillText(text, textCoords[0], textCoords[1])
                        })
                    }
                },
                {
                    key: 'drawMarkupXAnimation',
                    value: function drawMarkupXAnimation(props) {
                        var ctx = context.main;
                        var state = this.state;
                        var i2 = props.i2,
                        x = props.x,
                        y = props.y;
                        var spSin = Math.sin(state.markupOffset);
                        var sp = spSin <= 0 ? tools.cellEasing(Math.abs(spSin), 0, 1, 1) : 0;
                        var xCenter = plane.xCenter;
                        var percent = 1 / xCenter;
                        var pos = Math.abs(i2 - xCenter);
                        var point = percent * pos;
                        var f = sp >= point && sp <= point + percent ? (sp - point) / percent: 0;
                        if (!f) return;
                        tools.drawPath(ctx,
                        function() {
                            ctx.fillStyle = 'rgba(15,255,0,' + f * 0.5 + ')';
                            ctx.fillRect(x - cfg.sectionWidth / 2, y, cfg.sectionWidth, cfg.sectionHeight)
                        });
                        tools.drawPath(ctx,
                        function() {
                            if (cfg.shadowBlur) {
                                ctx.shadowBlur = 5;
                                ctx.shadowColor = 'chartreuse'
                            }
                            ctx.fillStyle = 'rgba(15,255,0,' + f * 0.3 + ')';
                            ctx.textBaseline = 'middle';
                            var textCoords = [x + cfg.sectionWidth / 2 + cfg.numberOffset, y + cfg.sectionHeight / 2];
                            ctx.fillText(xCenter - i2 + '', textCoords[0], textCoords[1])
                        })
                    }
                }]);
                return App
            } ();
            window.addEventListener('load',
            function() {
                window.app = new App()
            });