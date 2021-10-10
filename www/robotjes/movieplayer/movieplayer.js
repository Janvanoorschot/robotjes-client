/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * A 'movieplayer' paints a recording of a robomind simulation on a multi-layer animation on a canvas element.
 */
(function($) {

    var defaults = {
        // speed:0.5,
        speed:1.0,
        soundOn:true
    };

    /**
     * Functional constructor for the 'movieplayer' object.
     * @param node  html node
     * @param rootnoderootnode  the root-node that will be used to send () / receive (.on(...)) events.
     * @param skin  the skin used by the movieplayer
     * @param images  the images used by the movieplayer
     * @return the completed 'animator' object
     */
    $.fn.rm.movieplayer = function(id, node, rootnode, skin, images, width=600, height=400) {

        var that = {};

        // initialize data from defaults and constructor arguments
        for (n in defaults) {
            that[n] = defaults[n];
        }

        that.id = id;
        that.node = node;
        that.rootnode = rootnode;
        //that.ctx = $('.canvas', robomindide)[0].getContext('2d');
        that.skin = skin;
        that.images = images;
        that.width = width;
        that.height = height;
        that.center = null;

        that.tileSize = determineTileSize(that);
        that.centerX = -1;
        that.centerY = -1;
        that.centerZoom = 0.6;

        // app state
        that.isCentered = false;
        that.keepCentered = false;
        that.frameplayer = null;
        that.painter = null;
        that.recording = null;
        that.running = false;
        that.drawRequested = false;

        that.listeners = [];
        that.breakpoints = [];


        // public API
        that.start = function(recording, isRunning, isStepping) {
            var node = $('#myrobomindide');
            node .removeClass('RunModeStopped');
            node.addClass('RunModeRunning');
            doStart(that, recording, isRunning, isStepping);
        };

        that.timerTick = function () {
            doTimerTick(that);
        };

        that.stopped = function () {
            var node = $('#myrobomindide');
            node.removeClass('RunModeRunning');
            node.addClass('RunModeStopped');
            if (that.running) {
                that.running = false;
                that.frameplayer.cont();
            }
        };

        that.keepCenterPlayer = function (bool) {
            that.keepCentered = bool;
        };

        that.toggleKeepCenterPlayer = function () {
            that.keepCentered = !that.keepCentered;
        };

        that.moveToPlayer = function () {
            var tileSize = that.recording.tileSize;
            var toX, toY;
            if(that.frameplayer && 'robo' in that.frameplayer){
                if(that.frameplayer.robo.currentMinimation){
                    toX = (that.frameplayer.robo.currentMinimation.curX +0.5)*tileSize;
                    toY = (that.frameplayer.robo.currentMinimation.curY +0.5)*tileSize;
                    if(!isNaN(toX + toY)){
                        that.viewport.moveTo(toX,toY);
                    }
                }
            }
        };

        that.centerMap = function () {
            that.viewport.moveTo((that.centerX + 0.5) * that.tileSize, (that.centerY + 0.5) * that.tileSize);
            that.viewport.setScale(that.centerZoom)
        };

        that.translateView = function(tileDx, tileDy){
            var d = that.viewport.getScale() * that.tileSize;
            that.viewport.translateView(tileDx*d, tileDy*d);
        };

        that.stop = function() {
            if(that.frameplayer!=null) {
                that.frameplayer.stopHard();
                that.frameplayer = null;
            }
        };

        that.pause = function() {
            if(that.frameplayer != null) {
                that.frameplayer.pause();
            }
        };

        that.step = function() {
            if(that.frameplayer != null) {
                that.frameplayer.step();
            }
        };

        that.cont = function() {
            if(that.frameplayer != null) {
                that.frameplayer.cont();
            }
        };

        that.isFinished = function(){
            if(that.frameplayer != null) {
                return that.frameplayer.isFinished(that);
            }
            return false;
        };

        that.getSpeed = function() {
            return that.speed;
        };
        that.setSpeed = function(speed) {
            if(isNumeric(speed)) {
                that.speed = speed;
                if(that.frameplayer!=null) {
                    that.frameplayer.setSpeed(that.speed);
                }
                if(that.speedbuttonbar){
                    that.speedbuttonbar.update()
                }
                if (typeof $.fn.rm.updateSessionAttribute === 'function') {
                    $.fn.rm.updateSessionAttribute('speed', speed);
                }
            }
        };

        that.isSoundEnabled = function () {
            return that.soundOn;
        };

        that.setSoundEnabled = function (bool) {
            that.soundOn = bool;
            // do it
            if (bool) {
                // Howler.unmute();
                Howler.mute(false);
            }
            else {
                Howler.mute(true);
            }
            // change icons
            if (that.speedbuttonbar) {
                that.speedbuttonbar.update();
            }
            // save in session state
            if (typeof $.fn.rm.updateSessionAttribute === 'function') {
                $.fn.rm.updateSessionAttribute('soundenabled', bool);
            }

        };

        function isNumeric(o) {
            return ! isNaN (o-0);
        }

        that.dirty = function() {
            if(that.painter!=null) {
                that.painter.dirty();
            }
        };

        that.zoomIn = function () {
            that.viewport.zoomIn();
        };

        that.zoomOut = function () {
            that.viewport.zoomOut();
        };

        that.setScale = function (factor) {
            console.log('1:1'+ factor);
            that.viewport.setScale(factor);
        };

        that.setCenter = function (centerX, centerY, centerZoom) {
            that.centerX = centerX;
            that.centerY = centerY;
            that.centerZoom = centerZoom
        };

        that.setName = function(html){
            $('.namebar', node).html(html);
        };

        that.getName = function(){
            return $('.namebar', node).html();
        };

        that.getDuration = function() {
            if(that.frameplayer) {
                return that.frameplayer.getDuration();
            } else {
                return 0;
            }
        };

        that.clearBreakpoints = function() {
            that.breakpoints.splice(0,that.breakpoints.length)
            if(that.frameplayer != null) {
                that.frameplayer.clearBreakpoints();
            }
        };
        that.addBreakpoint = function(lineno) {
            if(that.breakpoints.indexOf(lineno) < 0) {
                that.breakpoints.push(lineno);
            }
            if(that.frameplayer!=null) {
                that.frameplayer.addBreakpoint(lineno);
            }
        };
        that.removeBreakpoint = function(lineno) {
            var idx = that.breakpoints.indexOf(lineno);
            if(idx >= 0) {
                that.breakpoints.splice(idx,1);
            }
            if(that.frameplayer!=null) {
                that.frameplayer.removeBreakpoint(lineno);
            }
        };
        that.hasBreakpoint = function(lineno) {
            if(that.frameplayer!=null) {
                return that.frameplayer.hasBreakpoint(lineno);
            } else {
                return false;
            }
        };

        that.clearListeners = function() {
            that.listeners.splice(0,that.listeners.length)
        };

        that.addListener = function(listener) {
            if(that.listeners.indexOf(listener) < 0) {
                that.listeners.push(listener);
            }
        };

        that.removeListener = function(listener) {
            var idx = that.listeners.indexOf(listener);
            if(idx >= 0) {
                that.listeners.splice(idx,1);
            }
        };

        populate(that);

        return that;
    };

    function populate(that) {
        // create the HTML nodes and the helper subcomponents
        var canvasNode = $(`<canvas class="canvas""></canvas>`);
        that.ctx = canvasNode[0].getContext('2d');
        that.node.append(canvasNode);
        var runbbNode = $('<div name="runbuttonbar" class="buttonbar" ></div>');
        that.node.append(runbbNode);
        var speedbbNode = $('<div name="speedbuttonbar" class="buttonbar hidable" ></div>');
        that.node.append(speedbbNode);
        var zoombbNode = $('<div name="zoombuttonbar" class="buttonbar hidable" ></div>');
        that.node.append(zoombbNode);
        var nameNode = $('<div name="namebar" class="namebar" ></div>');
        that.node.append(nameNode);

        that.runbuttonbar = $.fn.rm.rmrunbuttonbar(runbbNode,that.rootnode, that);
        that.speedbuttonbar = $.fn.rm.rmspeedbuttonbar(speedbbNode,that);
        that.zoombuttonbar = $.fn.rm.rmzoombuttonbar(zoombbNode,that);

        // create a viewport that can be scrolled/scaled/...
        that.viewport =  $.fn.rm.viewport(that.ctx.canvas);
        that.viewport.bindMobileEvents();
        that.viewport.setScale(0.6);

        that.viewport.addPainter(function (ctx) {
            that.dirty();
        });

        // stop centering the viewport when user drags view
        var hammer = Hammer(canvasNode[0], {
            drag_min_distance: 1,
            drag_horizontal: true,
            drag_vertical: true,
            prevent_default: true
        });

        hammer.on("dragstart", function(ev) {
            that.keepCenterPlayer(false);
        });

        // add window resize listener
        that.revalidate = function(){
            var scale  = that.viewport.getScale();
            var center = that.viewport.getTranslation();

            var ctx = canvasNode[0].getContext('2d');

            // resize AND resets transformation
            console.log(`canvassize-before: ${canvasNode[0].height}/${canvasNode[0].width}`);
            canvasNode[0].height = that.node.height()-5;
            canvasNode[0].width = that.node.width();
            console.log(`canvassize-after: ${canvasNode[0].height}/${canvasNode[0].width}`);

            // viewport is still in this mode, update canvas
            ctx.scale(scale, scale);
            ctx.translate(-center.x, -center.y);
            // force repaint
            that.dirty();
        };

        $(window).resize(that.revalidate);

        // hide extra toolbars
        if(!$.fn.rm.isTouchDevice){
            $(document).ready(function(){
                var timer = null;
                $(that.node).hover(
                    function(){
                        if(timer) {
                            clearTimeout(timer);
                        }
                        $(".hidable", that.node).fadeIn("fast");
                    },
                    function(){
                        var children = $(that.node).children(".hidable");
                        timer = setTimeout(function() {children.fadeOut("slow");}, 2000);
                    });
            });
        }
    }

    function doStart(that, recording, isRunning, isStepping) {

        that.recording = recording;
        // that.width = that.recording.mapWidth;
        // that.height = that.recording.mapHeight;

        // the painter is responsible for maintaining the scenery and painting the layers
        that.painter = $.fn.rm.painter(that.recording,that.ctx,that.viewport);

        // the frameplayer that will play/simulate the recording
        that.frameplayer = $.fn.rm.frameplayer(that.id, that.rootnode, that.recording,that.painter);
        that.frameplayer.setSpeed(that.speed);

        // hook into the listener interface of the frameplayer
        that.frameplayer.addListener( function(id,cmd,args) {
            // just pass the call on to our listeners
            that.listeners.forEach( function (listener) {
                listener(id,cmd,args);
            });
        });

        // set the breakpoints in the new frameplayer
        that.breakpoints.forEach( function(lineno) {
            that.frameplayer.addBreakpoint(lineno);
        });

        // get our center information from the recording when not yet present
        if(that.centerX < 0 ) {
            var center = that.recording.center();
            that.centerX = center[0];
            that.centerY = center[1];
            that.centerZoom = 0.6;
        }
        if(!that.isCentered) {
            that.isCentered = true;
            that.centerMap();
        }
        that.running = isRunning;
        that.frameplayer.start(isStepping);
    }

    /**
     * Update is called during every (!) timer tick.
     * It should be able to cope with the absence of a frameplayer and or a scenery
     * @param that the movieplayer object
     */
    function doTimerTick(that) {
        // draw: the call to the painter is scheduled in the display thread (animationFrame) if no call is outstanding
        if(that.painter!=null && !that.drawRequested) {
            that.drawRequested = true;
            requestAnimFrame(function() {
                animationFrame(that);
                if(that.keepCentered){
                    that.moveToPlayer();
                }
            });
        }
        // animation-progress: the frameplayer (if present) is always called
        if(that.frameplayer != null) {
            that.frameplayer.timerTick();
        }
    }

    function animationFrame(that) {
            that.painter.update();
            that.drawRequested=false;
    }

    function determineTileSize(that) {
        var defaultImage = that.images["tile-@"];
        return defaultImage.width;
    }

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame   ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
    })();
})(jQuery);