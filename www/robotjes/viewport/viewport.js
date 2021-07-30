/**
 * Viewport logic: translating and scaling within a canvas.
 */
(function($) {

    var defaults = {
        updateDuration:50
    };

    /**
     * Functional constructor.
     **/
    $.fn.rm.viewport = function(canvas) {
        var that = {};

        // bootstrapInitialize data from defaults and constructor arguments
        for (n in defaults) {
            that[n] = defaults[n];
        }


        var ctx = canvas.getContext("2d");
        var painters = [];

        // zoom bounds
        var minScale = 0.05;
        var maxScale = 3;

        // transfomation
        var scale = 1;
        var translateX = 0;
        var translateY = 0;


        // API

        /**
         * Repaint the underlying canvas
         */
        that.repaint = function(){
            for(var p in painters){
                painters[p](ctx, translateX, translateY, scale);
            }
        };

        /**
         * Set painter(ctx) function that draws content
         * @param fun painter(canvas.context)
         */
        that.addPainter = function(fun){
            painters.push(fun);
            if(fun != undefined){
                fun(ctx, translateX, translateY, scale);
            }
        };

        /**
         * Translate the view by an amount (in screen/mousemovement pixels)
         * @param screenDx x-translation
         * @param screenDy y-translation
         */
        that.translateView = function(screenDx, screenDy){
            var dx = -screenDx/scale;
            var dy = -screenDy/scale;
            translateX -= dx;
            translateY -= dy;
            ctx.translate(dx,dy);

            for(var p in painters){
                painters[p](ctx, translateX, translateY, scale);
            }

            //console.log('tx ' + Math.round(translateX) +', ty '+ Math.round(translateY) + ', scale ' + scale);
        };


        /**
         * Translate the view to center a given point in the world
         * (independent of scale/translation of viewport).
         * @param worldX x-location to center
         * @param worldY y-location to center
         */
        that.moveTo = function(worldX, worldY){
            var cx = canvas.width/scale/2 + translateX;
            var cy = canvas.height/scale/2 + translateY;
            var dx = (worldX - cx)*scale;
            var dy = (worldY - cy)*scale;
            that.translateView(dx,dy);
        };


        that.getCenter = function(){
            var cx = canvas.width/scale/2 + translateX;
            var cy = canvas.height/scale/2 + translateY;
            return {x:cx, y:cy};
        }

        that.getTranslation = function(){

            return {x:translateX, y:translateY};
        }

        /**
         * Zoom in/out.
         * @param zoomFactor zoom factor (> 1 = zoom in, < 1 = zoom out)
         * @param screenX mouse pointer x location, which stays fixed under the pointer.
         * @param screenY mouse pointer y location, which stays fixed under the pointer.
         */
        that.zoomView = function(zoomFactor, screenX, screenY){
            var scaledZoom = scale * zoomFactor;
            if(minScale < scaledZoom && scaledZoom < maxScale){
                // only zoom when allowed
                ctx.translate(translateX, translateY);
                ctx.scale(zoomFactor, zoomFactor);
                var dx = screenX / scale + translateX - screenX / scaledZoom;
                var dy = screenY / scale + translateY - screenY / scaledZoom;
                ctx.translate( -dx, -dy);
                translateX = dx;
                translateY = dy;
                scale *= zoomFactor;

                for(var p in painters){
                    painters[p](ctx, translateX, translateY, scale);
                }

                return true
            } else {
                return false;
            }
        };

        /**
         * Zoom in.
         */
        that.zoomIn = function(){
            var zoomFactor = 1.5;
            that.zoomView(zoomFactor, canvas.width/2, canvas.height/2);
        }

        /**
         * Zoom out.
         */
        that.zoomOut = function(){
            var zoomFactor = 1/1.5;
            that.zoomView(zoomFactor, canvas.width/2, canvas.height/2);

        }

        /**
         * Zoom to given scale. Keeps view centered.
         * @param newScale
         */
        that.setScale = function(newScale){
            return that.zoomView(newScale/scale, canvas.width/2, canvas.height/2);
        };

        that.getScale = function() {
            return scale;
        }

        /**
         * Make viewport listen to mouse events
         */
        that.bindDesktopEvents = function(){
            // bind translate event
            var dragTracker = $.fn.rm.mouseDragTracker(canvas);

            dragTracker.setMoveStateChangedFunction(function ( tracker, button ){
                that.translateView(tracker.dx(), tracker.dy());
            });

            // bind zoom event
            jQuery.fn.rm.ccMouseWheel(canvas, function (wheel, event){
                    var zoomFactor = Math.pow(1 + Math.abs(wheel)/2 , wheel > 0 ? 1 : -1);
                    that.zoomView(zoomFactor, event.offsetX, event.offsetY);
                }
            );
        };

        /**
         * Make viewport listen to touch & mouse events
         */
        that.bindMobileEvents = function(){
            var lastX = 0;
            var lastY = 0;
            var prevZoomFactor = scale;

            var hammer = Hammer(canvas, {
                drag_min_distance: 0,
                scale_treshold: 0,
                drag_horizontal: true,
                drag_vertical: true,
                transform: true,
                hold: false,
                prevent_default: true
            });

            hammer.on("dragstart", function(ev) {
                lastX = ev.gesture.center.pageX;
                lastY = ev.gesture.center.pageY;
            });

            hammer.on("drag", function(ev) {
                that.translateView(lastX - ev.gesture.center.pageX, lastY - ev.gesture.center.pageY);
                lastX = ev.gesture.center.pageX;
                lastY = ev.gesture.center.pageY;
            });

            hammer.on("transformstart", function(ev) {
                prevZoomFactor = 1;
            });


            hammer.on("transform", function(ev) {
                var pinchScale = ev.gesture.scale / prevZoomFactor;
                that.zoomView(pinchScale, canvas.width/2, canvas.height/2);
                prevZoomFactor = ev.gesture.scale;
            });

            // also scroll wheel
            jQuery.fn.rm.ccMouseWheel(canvas, function (wheel, event){
                    var zoomFactor = Math.pow(1 + Math.abs(wheel)/2 , wheel > 0 ? 1 : -1);
                    var eoffsetX = (event.offsetX || event.clientX - $(event.target).offset().left + window.pageXOffset );
                    var eoffsetY = (event.offsetY || event.clientY - $(event.target).offset().top + window.pageYOffset );
                    that.zoomView(zoomFactor, eoffsetX, eoffsetY);
                }
            );



        };

        return that;

    };

})(jQuery);