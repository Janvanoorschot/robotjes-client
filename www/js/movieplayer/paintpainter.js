/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Paints the 'pipe' componenents.
 *
 * @author jan
 * @since GOL1.0
 */
(function($) {

    var defaults = {
    };

    /**
     * Functional constructor for the painter.
     * @param recording
     */
    $.fn.rm.paintpainter = function(recording) {
        var that = {};

        // set data
        for (var n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        that.painterLocation = {};

        initialize(that);

        that.painterStarted = function(rb,color,fromX,fromY,dx,dy) {
            that.painterLocation[rb] = [fromX,fromY,dx,dy];
        }

        that.painterMoved = function(rb,color,fromX, fromY, toX, toY) {
            increaseLocation(that,rb,color,fromX,fromY,toX,toY);
        };

        that.painterStopped = function(rb,color,fromX, fromY, toX, toY) {
            increaseLocation(that, rb,color,fromX,fromY,toX,toY);
        };

        that.paint = function(color,curX,curY,nxtX,nxtY) {
            //console.log("paint["+color+"]["+curX+"]["+curY+"]["+nxtX+"]["+nxtY+"]");
            var c = "w";
            var t = ".";
            var x = curX;
            var y = curY;
            if(color == "black") {
                c = "b";
            }
            if(curX==nxtX) {
                // up or down
                if(curY < nxtY) {
                    // up
                    x = curX;
                    y = curY;
                    t = "|";
                    addStroke(that,c,t,curX,curY);
                } else {
                    // down
                    x = nxtX;
                    y = nxtY;
                    t = "|";
                    addStroke(that,c,t,x,y);
                }
            } else {
                // left or right
                if(curX < nxtX) {
                    // right
                    x = curX;
                    y = curY;
                    t = "-";
                    addStroke(that,c,t,curX,curY);
                } else {
                    // left
                    x = nxtX;
                    y = nxtY;
                    t = "-";
                    addStroke(that,c,t,x,y);
                }
            }
        };

        that.startPaint = function(color,x,y) {
            var c = "w";
            if(color == "black") {
                c = "b";
            }
            addStroke(that,c,'.',x,y);
        };

        that.draw = function(scenery) {
            that.paints.forEach( function(anitile) {
                    anitile.draw(scenery);
            })
        };

        return that;
    };

    function initialize(that) {
        loadPaintTypes(that);
        // walk through initial paints and insert them just like paints made during the run.
        that.paints = [];
        for(var i in that.recording.paintLines()) {
            var stroke = that.recording.paintLines()[i];
                var color = stroke.color;
                var type = stroke.type;
                var x = stroke.x;
                var y = stroke.y;
                addStroke(that,color,type,x,y);
        }
    }

    function addStroke(that,color,type,x,y) {
        var paintType = that.paintTypes[color + type];
        if(paintType!=null) {
            var image = that.recording.images[paintType];
            if(image != null) {
                var anitile = $.fn.rm.painttile(that.recording,x,y,image);
                that.paints.push(anitile);
            }
        }
    }

    function loadPaintTypes(that) {
        var paintTypes = {}
        paintTypes['w.'] = "strokeWhiteDot";
        paintTypes['w-'] = "strokeWhiteRight";
        paintTypes['w|'] = "strokeWhiteDown";
        paintTypes['b.'] = "strokeBlackDot";
        paintTypes['b-'] = "strokeBlackRight";
        paintTypes['b|'] = "strokeBlackDown";
        that.paintTypes = paintTypes;
    }

    function increaseLocation(that, rb,color,fromX,fromY,toX,toY) {
        // the last position drawn to is stored in that.painterLocation[rb]
        var lastX = that.painterLocation[rb][0];
        var lastY = that.painterLocation[rb][1];
        var dx = that.painterLocation[rb][2];
        var dy = that.painterLocation[rb][3];
        var curX = lastX;
        var curY = lastY;
        if(dx != 0) {
            // walk in the x direction
            if(dx > 0) {
                for(var x = lastX ; x+1 <= toX; x++) {
                    that.paint(color, x, fromY, x+1, fromY);
                    curX = x+1;
                }
            } else {
                for(var x = lastX ; x-1 >= toX; x--) {
                    that.paint(color, x, fromY, x-1, fromY);
                    curX = x-1;
                }
            }
        } else {
            //walk in the y direction
            if(dy > 0) {
                for(var y = lastY ; y+1 <= toY;y++) {
                    that.paint(color, fromX, y, fromX, y+1);
                    curY = y+1;
                }
            } else {
                for(var y = lastY ; y-1 >= toY; y--) {
                    that.paint(color, fromX, y, fromX, y-1);
                    curY = y-1;
                }
            }
        }
        that.painterLocation[rb] = [curX,curY,dx,dy];
    }


})(jQuery);
