/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Robo-sprite animation logic.
 * Robo is a sprite that is constructed from multiple components, the body, the head and the Gripper.
 * Robo adhers to the sprite-interface.
 **/
(function($) {

    var rotations = {
        'up':0,
        'right':Math.PI*1.5,
        'down':Math.PI,
        'left':Math.PI*0.5,
        'n':0,
        'e':Math.PI*1.5,
        's':Math.PI,
        'w':Math.PI*0.5
    };

    var defaults = {
        'currentX':0,
        'currentY':0,
        'currentDir':'up',
        'isPainting':false,
        'paintColor':'white',
        'id':'0'
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm.robo = function(id, recording,startX,startY,startDir) {
        var that = {};

        // set that 'fixed' data
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.id = id;
        that.recording = recording;
        that.tileSize = recording.tileSize;
        // Robo and its appendices (its arm) will be drawn on a 3x3 tile square, with the body in the middle
        // Minimations (animations performed during on 'step') will be performed within this square.
        that.roboimage = $.fn.rm.roboimage(that.recording);
        that.width = that.roboimage.width;
        that.height = that.width;
        that.offset = Math.floor(that.width/2);

        that.listeners = [];

        // initialise the start that will be maintained throught robo's life
        that.currentX = startX;
        that.currentY = startY;
        that.currentDir = startDir;                           // robot-body rotation
        that.hrot = 0;                                 // head rotation relative to robot-body
        that.ang = 0;
        that.currentMinimation = null;
        that.roboimage.reset();
        that.roboimage.setAngle(rotations[that.currentDir]);
        that.currentImage = that.roboimage.image();

        that.hasNextImage = false; // true iff there is a next Image
        that.hasNextPosition = false;
        that.nextX =  that.currentX;
        that.nextY = that.currentY;
        that.nextIsPainting = false;
        that.nextPaintColor = 'white';
        that.nextImage = null;

        that.dump = function() {
            return "robo["+that.id+"]=["+that.currentX+","+that.currentY+"]["+that.currentDir+"]";
        };

        that.addListener = function(handler) {
            that.listeners.push(handler);

        };

        that.setNextImage = function(image) {
            that.hasNextImage = true;
            that.nextImage = image;
        };

        that.setNextPosition = function(x,y) {
            that.nextX = x;
            that.nextY = y;
            that.hasNextPosition = true;
        };

        that.initializeNext = function() {
            that.nextX = that.currentX;
            that.nextY = that.currentY;
            that.nextDir = that.currentDir;
            that.nextIsPainting = that.isPainting;
            that.nextPaintColor = that.paintColor;
        };

        that.setNextDirection = function(dir) {
            that.nextDir = dir;
            that.hasNextPosition = true;
        };

        that.setNextPaint = function(isPainting,paintColor) {
            that.nextIsPainting = isPainting;
            that.nextPaintColor = paintColor;
            that.hasNextPosition = true;
        };

        that.updateCurrent = function() {
            if(that.hasNextPosition) {
                that.currentX = that.nextX;
                that.currentY = that.nextY;
                that.currentDir = that.nextDir;
                that.isPainting = that.nextIsPainting;
                that.paintColor = that.nextPaintColor;
                that.hasNextPosition = false;
            }
        };

        that.prepareRoboImage = function() {
            that.roboimage.reset();
            that.roboimage.setAngle(rotations[that.currentDir]);
            if(that.isPainting) {
                if(that.paintColor=='black') {
                    that.roboimage.setPaint('black',6);
                } else {
                    that.roboimage.setPaint('white',6);
                }
            }
            return that.roboimage;
        };

        /*****************************************************************************
         * Drawing interface (called by spritePainter)
         * This interface asumes that the following state has been maintained
         * by the simulation:
         *    - that.currentImage
         *    - that.currentX
         *    - that.currentY
         *    - that.hasNextImage -- true iff there is a new image in that.nextImage
         *    - that.nextImage
         *    - that.nextX
         *    - that.nextY
         */
        that.prepare = function(scenery) {
            var result = that.hasNextImage;
            //if(that.hasNextImage) {
                // make sure the old location is redrawn by other layers during the 'draw' phase.
                scenery.markDirty(that.currentX - that.offset,that.currentY-that.offset,that.width,that.height);
            //}
            return result;
        }

        that.draw = function(scenery) {
            if(that.hasNextImage) {
                // there is a new image in the 'next' state, embrace it
                that.currentImage = that.nextImage;
                that.currentX = that.nextX;
                that.currentY = that.nextY;
                that.hasNextImage = false;
                scenery.paintImage(that.currentX - that.offset,that.currentY - that.offset,that.currentImage);
                scenery.markDirty(that.currentX - that.offset,that.currentY-that.offset,that.width,that.height);
            } else if(scenery.isDirty(that.currentX - that.offset,that.currentY-that.offset,that.width,that.height)) {
                scenery.paintImage(that.currentX - that.offset,that.currentY - that.offset,that.currentImage);
                scenery.markDirty(that.currentX - that.offset,that.currentY-that.offset,that.width,that.height);
            }
        }
        /******************************************************************************
         *  Sprite/Robo interface (called by 'performCommand' in frameplayer
         */

        that.progressCommand = function(totalTime, ellapsedTime) {
            if(that.currentMinimation != null) {
                that.currentMinimation.progress(totalTime, ellapsedTime);
            }
        }

        that.completeCommand = function() {
            if(that.currentMinimation != null) {
                that.currentMinimation.stop();
                that.currentMinimation = null;
                that.updateCurrent();
                that.listeners.forEach( function(listener) {
                    if('spriteDone' in listener) {
                        listener.spriteDone(that);
                    }
                });
            }
        }

        /**
         * Below are the 'startCommand' commands.
         * When one of these is called we can be sure that:
         *   . currentMinimation == null
         *   . currentX, currentY, etc are valid
         */
        that.forward = function(amount, bumpDuration) {
            switch(that.currentDir) {
                case 'up':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,0,-1,amount >= 0,amount,bumpDuration);
                    break;
                case 'down':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,0,1,amount >= 0,amount,bumpDuration);
                    break;
                case 'left':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,-1,0,amount >= 0,amount,bumpDuration);
                    break;
                default:
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,1,0,amount >= 0,amount,bumpDuration);
                    break;
            }
        };

        that.backward = function(amount, bumpDuration) {
            switch(that.currentDir) {
                case 'up':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,0,1,amount < 0,amount,bumpDuration);
                    break;
                case 'down':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,0,-1,amount < 0,amount,bumpDuration);
                    break;
                case 'left':
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,1,0,amount < 0,amount,bumpDuration);
                    break;
                default:
                    that.currentMinimation = moveAnim(that,that.currentX,that.currentY,-1,0,amount < 0,amount,bumpDuration);
                    break;
            }
        };

        that.happyTurn = function(){
            that.currentMinimation = happyTurnAnim(that);
        };

        that.nonono = function(){
            that.currentMinimation = nononoAnim(that);
        };

        that.rotateLeft = function(n) {
            var dirs  = ['up','right','down','left'];
            var ix = dirs.indexOf(that.currentDir);
            var nextDir = dirs[((ix - n)%4 + 4)%4]; // remainder instead of modulo
            that.currentMinimation = turnAnim(that,that.currentDir, nextDir, n * Math.PI / 2);
        };

        that.rotateRight = function(n) {
            var dirs  = ['up','right','down','left'];
            var ix = dirs.indexOf(that.currentDir);
            var nextDir = dirs[(((ix + n)%4) + 4)%4]; // remainder instead of modulo
            that.currentMinimation = turnAnim(that,that.currentDir, nextDir, -n * Math.PI / 2 );
        };

         // dir ["left"|"front"|right"]
         // sub ["obstacle"|"clear"|"beacon"|"white"|"black"]
        that.see = function(dir,sub) {
            if(dir=="left") {
                var fromAngle = rotations[that.currentDir];
                var rotation =  - Math.PI*0.5;
                that.currentMinimation = turnHeadAnim(that,fromAngle,rotation);
            } else if(dir == "right") {
                var fromAngle = rotations[that.currentDir];
                var rotation =  Math.PI*0.5;
                that.currentMinimation = turnHeadAnim(that,fromAngle,rotation);
            }
        }
        /**
         * Flip the coin.
         */
        that.flipCoin = function() {
            that.currentMinimation = flipCoinAnim(that);
        }
        /**
         * @param msg=["success"|"again"|"changeColor"]
         */
        that.paintWhite = function(msg) {
            if(msg == 'success' || msg=='again') {
                // get out the white brush in the second half
                that.currentMinimation = paintAnim(that,'none','white');
            } else if(msg == 'changeColor') {
                // get in the black brush in the first half, get out the white brush in the second half
                that.currentMinimation = paintAnim(that,'black','white');
            }
        }
        /**
         * @param msg=["success"|"again"|"changeColor"]
         */
        that.paintBlack = function(msg) {
            if(msg == 'success' || msg=='again') {
                // get out the black brush in the second half
                that.currentMinimation = paintAnim(that,'none','black');
            } else if(msg == 'changeColor') {
                // get in the white brush in the first half, get out the black brush in the second half
                that.currentMinimation = paintAnim(that,'white','black');
            }
        }
        /**
         * @param msg["success"|"again"]
         */
        that.stopPainting = function(msg) {
            if(msg == 'success' || msg=='again') {
                // get out the (white|black) brush in the first half
                if(that.isPainting && that.paintColor=='white') {
                    that.currentMinimation = paintAnim(that,'white','none');
                } else if(that.isPainting && that.paintColor=='black') {
                    that.currentMinimation = paintAnim(that,'black','none');
                }
            }
        }
        /**
         * @param msg=["success"|""againstObstacle"|"noBeacon"|"alreadyBeacon"], beaconID or -1
         */
        that.gripperGet = function(msg) {
            if(msg=="success") {
                //0->max open, 0->max close+beacon
                that.currentMinimation = armAnim(that,9,'open',false,'closed','closed',true);
            } else if(msg=="againstObstacle") {
                //0->1/3 open, 0->1/3 open
                that.currentMinimation = armAnim(that,7,'open',false,'open','open',false);
            } else if(msg=="noBeacon") {
                //0->max open,closed,open,closed,max->0 open
                that.currentMinimation = armAnim(that,9,'open',false,'wiggle','open',false);
            }
        }
        /**
         * @param msg=["success"|""againstObstacle"|"noBeacon"], beaconID or -1
         */
        that.gripperPut = function(msg) {
            if(msg=="success") {
                //0->max close+beacon, max->0 open
                that.currentMinimation = armAnim(that,9,'closed',true,'open','open',false);
            } else if(msg=="againstObstacle") {
                // nothing
            } else if(msg=="noBeacon") {
                //nothing
            }
        }
        /**
         * @param msg=["success"|""againstObstacle"|"noBeacon"], beaconID or -1
         */
        that.gripperEat = function(msg) {
            that.gripperGet(msg);
        }

        return that;
    };
    /**********************************************************************************
     * Utility functions
     */

    function calcRotation(from,to) {
        var res = to - from;
        res = res % (Math.PI*2)
        if(res > Math.PI) {
            res = res - Math.PI*2;
        } else if(res < -Math.PI) {
            res = res + Math.PI*2;
        }
        return res;
    }

    /**********************************************************************************
     *  Minimations: Animations of mini movements
     *               The side-effects of these minimations are a call to 'robo.setNextPosition'
     *               which will update the the robo image/position that will be shown during the
     *               next animationFrame.
     *********************************************************************************/
    /**
     * Move Robo 'robo' from X0 to X1 in 'steps' steps.
     *
     * Note that the 'move' Minimation is the only place where robo can tranform
     * from one location to an other. This is the place where the listeners should be
     * informed about these transitions.
     *
     * @param robo      Robo herself
     * @param x
     * @param y
     * @param dx        starting x coordinate in tiles
     * @param dy        starting y coordinate in tiles
     * @param forward   true and only true if the robo is moving forward (important for painting)
     * @param bumpDuration   does robot bump after moving? Then bumpduration is the time reserved for animating bumping. Else
     * @return          the new minimation object
     */
    var moveAnim = function(robo,x,y,dx,dy, forward, amount, bumpDuration) {
        var that = {};
        that.robo = robo;
        that.x = x;
        that.y = y;
        that.dx = dx * amount;
        that.dy = dy * amount;
        that.curX = that.x;
        that.curY = that.y;
        that.forward = forward;

        that.robo.listeners.forEach( function(listener) {
            if('spriteStarted' in listener) {
                listener.spriteStarted(that.robo, that.x,that.y, that.dx, that.dy);
            }
        });

        that.progress = function(totalTime, ellapsedTime) {
            var totalMoveTime = totalTime - bumpDuration;

            if(totalMoveTime){
                // just move
                var fract = ellapsedTime / (totalMoveTime );
                // calculate the next position in fracts
                var curX = that.x + that.dx * fract;
                var curY = that.y + that.dy * fract;
            }
            else{
                // no move, possibly only bump
                var fract = ellapsedTime / (bumpDuration );
                // calculate the next position in fracts
                var curX = that.x + (that.dx || dx*0.2) * fract;
                var curY = that.y + (that.dy || dy*0.2) * fract;
            }

            if(ellapsedTime >= totalMoveTime + bumpDuration/2){
                // bump back
                fract = 1 + (totalTime - ellapsedTime)/totalTime;
                curX = that.x + that.dx * fract;
                curY = that.y + that.dy * fract;
            }
            // determine which tile is occupied
            var roundX = Math.round(curX);
            var roundY = Math.round(curY);
            // determine which part of the next Tile is occupier
            var fractX = curX - roundX;
            var fractY = curY - roundY;
            // determine the next image
            var roboimage = that.robo.prepareRoboImage();
            if(that.robo.isPainting) {
                roboimage.setPaintDirection(that.robo.currentDir);
                roboimage.setPaintReverse(!that.forward)
            }
            roboimage.setX(fractX*that.robo.tileSize);
            roboimage.setY(fractY*that.robo.tileSize);
            // inform robo about it's new state
            robo.setNextImage(roboimage.image());
            robo.setNextPosition(roundX,roundY);
            // inform any listeners of the location change
            that.robo.listeners.forEach( function(listener) {
                if('spriteMoved' in listener) {
                    listener.spriteMoved(that.robo, that.curX,that.curY, curX, curY);
                }
            });
            that.curX = curX;
            that.curY = curY;


        }
        that.stop = function() {
            var curX = that.x + that.dx;
            var curY = that.y + that.dy;
            that.robo.initializeNext();
            that.robo.setNextPosition(curX,curY);
            that.robo.updateCurrent();
            var roboimage = that.robo.prepareRoboImage();
            robo.setNextImage(roboimage.image());
            // inform any listeners of the final location
            that.robo.listeners.forEach( function(listener) {
                if('spriteStopped' in listener) {
                    listener.spriteStopped(that.robo, that.curX, that.curY, curX, curY);
                }
            });
        };

        return that;
    }

    /**
     * Happy turn Robo 'robo' from rotation A0 to A1 in 'steps' steps,
     * @param robo      Robo herself
     * @param fromDir   start direction
     * @param toDir     end direction
     * @return          the new minimation object
     */
    var happyTurnAnim = function(robo) {
        var that = {};
        that.robo = robo;
        that.baseDir = robo.currentDir;
        that.baseRot = rotations[robo.currentDir];

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            var currentRotation = 0;
            var currentHeadRotation = 0;
            if(fract < 0.3){
                // bit to left
                currentRotation = (Math.PI/4) * (fract/0.3);
                currentHeadRotation = -currentRotation; // turn head as well for extra drama
            }
            else{
                // swing to right
                var t = ((fract-0.3)/0.7) *  (Math.PI /2);
                currentRotation = -(4*Math.PI) * Math.sin(t);
                currentHeadRotation = 0;
            }
            // calculate the next rotation, and inform the robo
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setAngle(currentRotation + that.baseRot);
            roboimage.setHeadAngle(currentHeadRotation);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }

        that.stop = function() {
            // set image
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setAngle(that.baseRot);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
            // set location etc
            that.robo.initializeNext();
            that.robo.setNextDirection(that.baseDir);
            that.robo.updateCurrent();
        }
        return that;
    }

    /**
     * Turn Robo 'robo' head
     * @param robo      Robo herself
     * @return          the new minimation object
     */
    var nononoAnim = function(robo) {
        var that = {};
        that.robo = robo;
        that.fromang = rotations[robo.currentDir];
        that.rotation = -.25*Math.PI;

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            var ang =  Math.sin(fract * 4 * Math.PI) *that.rotation;
            var roboimage = that.robo.prepareRoboImage();
            that.robo.roboimage.setHeadAngle(ang);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }
        that.stop = function() {
        }
        return that;
    }

    /**
     * Turn Robo 'robo' from rotation A0 to A1 in 'steps' steps,
     * @param robo      Robo herself
     * @param fromDir   start direction
     * @param toDir     end direction
     * @return          the new minimation object
     */
    var turnAnim = function(robo,fromDir,toDir, theta) {
        var that = {};
        that.robo = robo;
        that.fromDir = fromDir;
        that.toDir = toDir;
        that.fromRot = rotations[that.fromDir];
        that.toRot = rotations[that.toDir];
        that.rotation = theta;//calcRotation(that.fromRot,that.toRot);

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            // calculate the next rotation, and inform the robo
            var currentRotation = that.rotation * fract;
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setAngle(currentRotation + rotations[that.fromDir]);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }

        that.stop = function() {
            // set image
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setAngle(rotations[that.toDir]);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
            // set location etc
            that.robo.initializeNext();
            that.robo.setNextDirection(that.toDir);
            that.robo.updateCurrent();
        }
        return that;
    }

    /**
     * Turn Robo 'robo' head
     * @param robo      Robo herself
     * @param fromang   starting (and end) head angle
     * @param rotation  amount to turn
     * @return          the new minimation object
     */
    var turnHeadAnim = function(robo,fromang,rotation) {
        var that = {};
        that.robo = robo;
        that.fromang = fromang;
        that.rotation = rotation;

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            var ang = 0;
            if(fract < 0.5) {
                // ang = that.fromang + fract*that.rotation;
                ang = 2*fract*that.rotation;
            } else {
                // ang = that.fromang + (1-fract)*that.rotation;
                ang = 2*(1-fract)*that.rotation;
            }
            var roboimage = that.robo.prepareRoboImage();
            that.robo.roboimage.setHeadAngle(ang);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }
        that.stop = function() {
        }
        return that;
    }

    /**
     * Let Robo flip a coing.,
     * @param robo      Robo herself
     * @return          the new minimation object
     */
    var flipCoinAnim = function(robo) {
        var that = {};
        that.robo = robo;

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            var coinPhase = Math.floor(15 * fract);
            var roboimage = that.robo.prepareRoboImage();
            that.robo.roboimage.setCoin('flip',coinPhase);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }
        that.stop = function() {
        }
        return that;
    }

    /**
     * Get out/in the paint brush.
     * @param robo      Robo herself
     * @param colorIn   color of paint-brush that is pulled in during the first half (white, black, none)
     * @param colorOut  color of paint-brush that is pulled out during the second half (white, black, none)
     * @return          the new minimation object
     */
    var paintAnim = function(robo, colorIn, colorOut) {
        var that = {};
        that.robo = robo;
        that.colorIn = colorIn;
        that.colorOut = colorOut;

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;
            // calculate the paintColor and the paintPhase
            var paintColor='none';
            var paintPhase=0;
            if(fract < 0.5) {
                // going in
                if(that.colorIn=='white') {
                    paintColor = 'white';
                } else if(that.colorIn=='black') {
                    paintColor = 'black';
                }
                // from 6->0
                paintPhase = Math.floor((1-2*fract)*6);
            } else {
                //going out
                if(that.colorOut=='white') {
                    paintColor = 'white';
                } else if(that.colorOut=='black') {
                    paintColor = 'black';
                }
                // from 0->6
                paintPhase = Math.floor((2*fract-1)*6);
            }
            // prepare the next image
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setPaint(paintColor,paintPhase);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }
        that.stop = function() {
            // set image
            // var isPainting = (colorOut !='none' && colorIn=='none');
            var isPainting = colorOut !='none';
            var roboimage = that.robo.prepareRoboImage();
            roboimage.setPaint(that.colorOut,6);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
            // sset robo state
            that.robo.initializeNext();
            that.robo.setNextPaint(isPainting,colorOut);
            that.robo.updateCurrent();
        }
        return that;
    }

    /**
     * Get out/in the arm, possibly with a beacon.
     * Note that the animation is responisble for drawing all of the beacon during anim time
     * @param robo          Robo herself
     * @param endHasBeacon
     * @param maxOut
     * @param outState
     * @param outHasBeacon
     * @param middleAction
     * @param inState
     * @param inHasBeacon
     * @return             the new minimation object
     */
    var armAnim = function(robo,maxOut,outState,outHasBeacon,middleAction,inState,inHasBeacon) {
        var that = {};
        that.robo = robo;
        that.maxOut = maxOut;
        that.outState = outState;
        that.outHasBeacon = outHasBeacon;
        that.middleAction = middleAction;
        that.inState = inState;
        that.inHasBeacon = inHasBeacon;

        that.progress = function(totalTime, ellapsedTime) {
            var fract = ellapsedTime / totalTime;

            var gripperState = 'open';
            var gripperPhase = 0;
            var hasBeacon = false;
            var endBeacon = false;
            if(fract < 0.4) {
                // in the 'out' state
                gripperState = that.outState;
                var phase =  (2.5*fract);
                gripperPhase = Math.floor(phase*that.maxOut);
                hasBeacon = that.outHasBeacon;
                endBeacon = that.inHasBeacon;
            } else if(fract > 0.6) {
                // in the 'in' state
                gripperState = that.inState;
                var phase =  2.5*(1-fract);
                gripperPhase = Math.floor(phase*that.maxOut);
                hasBeacon = that.inHasBeacon;
                endBeacon = that.outHasBeacon;
            } else {
                // in the 'inbetween' state
                if(that.middleAction=='wiggle') {
                    var phase = Math.floor((fract - 0.4)*20);
                    if(phase%2==0) {
                        gripperState = 'open';
                    } else {
                        gripperState = 'closed';
                    }
                } else {
                    gripperState = middleAction;
                }
                gripperPhase = that.maxOut;
                hasBeacon = false;
                endBeacon = that.outHasBeacon || that.inHasBeacon;
            }
            var roboimage = that.robo.prepareRoboImage();
            that.robo.roboimage.setGripper(gripperState,gripperPhase,hasBeacon,endBeacon);
            that.image = roboimage.image();
            that.robo.setNextImage(that.image);
        }
        that.stop = function() {
        }
        return that;
    }

})(jQuery);