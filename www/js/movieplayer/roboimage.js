/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Robo-sprite image drawing logic.
 */
(function($) {

    var defaults = {
        'x': 0,
        'y': 0,
        'angle':0,
        'headAngle': 0,
        'paintColor':'none',
        'paintPhase':0,
        'paintReverse': false,
        'paintDirection': 'none',
        'gripperState':'closed',
        'gripperPhase':0,
        'gripperHasBeacon':false,     // beacon in the arm
        'gripperEndBeacon': false,   // beacon at the end-point
        'coinState':'none',
        'coinPhase':'0'
    };

    /**
     * Functional constructor for a robo-image drawer.
     */
    $.fn.rm.roboimage = function(recording) {
        var that = {};

        // load defaults
        that.reset = function() {
            for (n in defaults) {
                that[n] = defaults[n];
            }
        }
        that.reset();

        // set data
        that.recording = recording
        that.images = recording.images;
        that.tileSize = recording.tileSize;
        that.width = 3;
        // create a canvas
        that.canvas = document.createElement('canvas');
        that.canvas.width = that.width*that.tileSize;
        that.canvas.height = that.canvas.width;

        /**
         * Setters of Robo characteristics
         */

        that.setX = function(x) {
            if(x > that.tileSize) {
                that.x = that.tileSize;
            } else if(x < - that.tileSize) {
                that.x = -that.tileSize;
            } else {
                that.x = Math.floor(x);
            }
        }

        that.setY = function(y) {
            if(y > that.tileSize) {
                that.y = that.tileSize;
            } else if(y < - that.tileSize) {
                that.y = -that.tileSize;
            } else {
                that.y = Math.floor(y);
            }
        }

        that.setPaintDirection = function(dir) {
            that.paintDirection = dir;
        }

        that.setPaintReverse = function(reverse) {
            that.paintReverse = reverse;
        }

        that.setAngle = function(angle) {
            that.angle = angle;
        }

        that.setHeadAngle = function(headAngle) {
            that.headAngle = headAngle;
        }

        that.setPaint = function(paintColor,paintPhase){
            if(paintColor == 'white' || paintColor == 'black') {
                that.paintColor = paintColor;
            } else {
                that.paintColor = defaults.paintColor;
            }
            if(paintPhase>= 0 && paintPhase < 7) {
                that.paintPhase = paintPhase;
            } else {
                that.paintPhase = defaults.paintPhase;
            }
        }

        that.setGripper = function(gripperState,gripperPhase, hasBeacon, endBeacon) {
            if(gripperState == 'open' || gripperState == 'closed') {
                that.gripperState = gripperState;
            } else {
                that.gripperState = defaults.gripperState;
            }
            if(gripperPhase>= 0 && gripperPhase < 10) {
                that.gripperPhase = gripperPhase;
            } else {
                that.gripperPhase = defaults.gripperPhase;
            }
            if(hasBeacon) {
                that.gripperHasBeacon = true;

            } else {
                that.gripperHasBeacon = false;
            }
            if(endBeacon) {
                that.gripperEndBeacon = true;
            } else {
                that.gripperEndBeacon = false;
            }
        }

        that.setCoin = function(coinState,coinPhase) {
            if(coinState == 'flip') {
                that.coinState = coinState;
            } else {
                that.coinState = defaults.coinState;
            }
            if(coinPhase>= 0 && coinPhase < 14) {
                that.coinPhase = coinPhase;
            } else {
                that.coinPhase = defaults.coinPhase;
            }
        }

        /**
         * Payload ... Get the image of Robo given it's given characteristics
         */
        that.image = function() {
            calculateRoboImage(that);
            return that.canvas;
        }
        return that;
    }


    function calculateRoboImage(that) {
        //console.log("[x,y]=["+that.x + "," + that.y + "]");
        var halfTile = Math.floor(that.tileSize/2);
        var midth = Math.floor(that.canvas.width/2);

        var ctx= that.canvas.getContext('2d');
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
        ctx.restore();

        // draw the paint
        if(that.paintDirection != 'none') {
            var imageName = null;
            var tx = 0;
            var ty = 0;
            var sx = 0;
            var sy = 0;
            var width = 0;
            var height = 0;
            var dx = 0;
            var dy = 0;
            if((that.paintDirection == 'up' && !that.paintReverse) || (that.paintDirection == 'down' && that.paintReverse)) {
                imageName = 'strokeWhiteDown';
                var width = that.images['strokeWhiteDown'].width;
                var height = that.images['strokeWhiteDown'].height;
                tx = that.tileSize;
                if(that.y<0) {
                    ty = 0;
                    sx=0;
                    sy = that.tileSize + that.y + 100;
                    height = height -sy;
                    width = width;
                    dx = sx;
                    dy = sy;
                } else {
                    ty=that.tileSize;
                    sx=0;
                    sy = that.y + 50;
                    height = height - sy;
                    width = width;
                    dx = sx;
                    dy = sy;
                }
            } else if((that.paintDirection == 'down' && !that.paintReverse) || (that.paintDirection == 'up' && that.paintReverse)) {
                imageName = 'strokeWhiteDown';
                var width = that.images['strokeWhiteDown'].width;
                var height = that.images['strokeWhiteDown'].height;
                tx = that.tileSize;
                if(that.y>0) {
                    ty = that.tileSize;
                    sx=0;
                    sy = 0;
                    height = that.tileSize/2
                    width = width;
                    dx = sx;
                    dy = sy;
                } else {
                    ty = 0;
                    sx=0;
                    sy = 0;
                    height = that.tileSize + (that.tileSize/2 + that.y)
                    width = width;
                    dx = sx;
                    dy = sy;
                }
            } else if((that.paintDirection == 'right' && !that.paintReverse) || (that.paintDirection == 'left' && that.paintReverse)) {
                imageName = 'strokeWhiteRight';
                var width = that.images['strokeWhiteRight'].width;
                var height = that.images['strokeWhiteRight'].height;
                if(that.x>0) {
                    tx = that.tileSize;
                    sx=0;
                    sy = 0;
                    height = height;
                    width = 50 + that.x;
                    dx = sx;
                    dy = sy;
                } else {
                    tx = 0;
                    sx=0;
                    sy = 0;
                    height = height;
                    width = that.tileSize + that.x + 50;
                    dx = sx;
                    dy = sy;
                }
                ty = that.tileSize;
            } else if((that.paintDirection == 'left' && !that.paintReverse) || (that.paintDirection == 'right' && that.paintReverse)) {
                imageName = 'strokeWhiteRight';
                var width = that.images['strokeWhiteRight'].width;
                var height = that.images['strokeWhiteRight'].height;
                if(that.x<0) {
                    tx = 0;
                    sx=that.tileSize + that.x + 100;
                    sy = 0;
                    height = height;
                    width = width - sx;
                    dx = sx;
                    dy = sy;
                } else {
                    tx = that.tileSize
                    sx=that.x + 50;
                    sy = 0;
                    height = height;
                    width = width - sx;
                    dx = sx;
                    dy = sy;
                }
                ty = that.tileSize;
            }
            if(that.paintColor == 'black') {
                imageName = imageName.replace('White','Black');
            }
            var image =  that.images[imageName];
            ctx.save();
            ctx.translate(tx,ty);
            ctx.drawImage(image,sx,sy,width,height,dx,dy,width,height);
            ctx.restore();
        }

        // on drawing
        ctx.save();

        // translate and rotate the canvas to the correct angle of the body
        ctx.translate(midth + that.x ,midth + that.y);
        ctx.rotate( - that.angle);

        // draw the shadow
        ctx.save();
        var shadow = that.images['robotShadow'];
        var fx = Math.floor(0.1 * shadow.width * Math.cos(that.angle + 0.25*Math.PI));
        var fy = Math.floor(0.1 * shadow.width * Math.cos(that.angle - 0.25*Math.PI));
        ctx.translate(fx, fy);
        ctx.drawImage(shadow,-halfTile,-halfTile);
        ctx.restore();

        // draw the beacon
        var beaconImg =that.images['beacon'];
        if(that.gripperHasBeacon) {
            // draw the beacon at a location so the arm seems to be gripping it (see gripperPhase)
            var fx = 0;
            var fy = -(that.gripperPhase+1)*20;
            ctx.save();
            ctx.translate(fx,fy);
            ctx.rotate(that.angle);
            ctx.drawImage(beaconImg,-halfTile,-halfTile);
            ctx.restore();
        } else if(that.gripperEndBeacon) {
            // draw the beacon so it seems to be at the location in front of the robo-bot
            var fx = 0;
            var fy = - that.tileSize;
            ctx.save();
            ctx.translate(fx, fy);
            ctx.rotate(that.angle);
            ctx.drawImage(beaconImg,-halfTile,-halfTile);
            ctx.restore();
        }

        // draw the gripper
        if(that.gripperPhase>2) {
            var gripImg = null;
            if(that.gripperState=='open') {
                gripImg = that.images['robotGripperOpen'];
            } else if(that.gripperState='closed') {
                gripImg = that.images['robotGripperClosed'];
            }
            if(gripImg) {
                var fx=0;
                var fy= -(that.gripperPhase+1)*20 + 120;
                ctx.save();
                ctx.translate(fx,fy);
                ctx.drawImage(gripImg,-halfTile,-halfTile);
                ctx.restore();
                //ctx.drawImage(gripImg,-halfTile,-halfTile - that.gripperPhase*10);
            }
        }

        // draw the body
        var body = that.images['robotBody'];
        ctx.drawImage(body,-halfTile,-halfTile);

        // draw the paintbrush
        var paintImg = null;
        if(that.paintColor=='white') {
            var paintImg = that.images['paintWhite'];
        } else if(that.paintColor=='black') {
            var paintImg = that.images['paintBlack'];
        }
        if(paintImg) {
            var width = that.tileSize;
            var height = halfTile;
            ctx.drawImage(paintImg,that.paintPhase*width,0,width,height,-100,0,width,height);
        }

        // draw the head
        ctx.save();
        var head = that.images['robotHead'];
        ctx.rotate( that.headAngle);
        ctx.drawImage(head,-halfTile,-halfTile);
        ctx.restore();

        // draw the coin
        var coinImg = null;
        if(that.coinState == 'flip') {
            coinImg = that.images['coinFlip'];
        }
        if(coinImg) {
            var width = 30;
            var offset = -55
            ctx.drawImage(coinImg,that.coinPhase*width,0,width,width,offset,offset,width,width);
        }

        // return the canvas that can be used to draw using 'drawImage' on the parent canvas.
        ctx.restore();
    }


})(jQuery);