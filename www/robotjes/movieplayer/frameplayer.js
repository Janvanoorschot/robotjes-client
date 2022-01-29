/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Responsible for progressing the moving components in a recording.
 * Responsible for:
 *   - maintaining progression of simulation time (start/stop/pause/step/continue and the speed
 *   - 'playing' of the frames in the recording and instructing the sprites
 * User: jan
 * Date: 6-12-12/23-11-20
 * Time: 14:22
 */
(function ($) {
    "use strict";
    /*global jQuery */

    var defaults = {
        updateDuration:50
    };

    var commandDuration = {
        'crt':100,   // create robo
        'des':100,    // destroy robo
        'f':1000,    // forward
        'b':1000,    // backward
        'bump':300,  // collision
        'l':1000,    // left
        'r':1000,    // right
        's':1000,    // see
        'gg':1000,   // gripper get
        'ge':1000,   // gripper eat
        'gp':1000,   // gripper put
        'pw':1000,   // paint white
        'pb':1000,   // paintblack
        'sp':1000,   // stop painting
        'fc':1000,   // flip-coin
        'asn':100,   // asignment
        'brk':100,   // break
        'end':100,   // end
        'ret':100,    // return
        'shi':100,    // show int
        'sht':100,    // show text
        'happy':1000, // success
        'nonono':1000 // fail
    };
    $.fn.rm.commandDuration = commandDuration;
    var argCommands = {
        'f':true,
        'b':true,
        'l':true,
        'r':true,
    };
    $.fn.rm.argCommands = argCommands;

    /**
     * Functional constructor for 'frameplayer' object
     * @return the completed object
     */
    $.fn.rm.frameplayer = function (id, rootnode, recording, painter) {
        var that = {};

        // bootstrapInitialize data from defaults and constructor arguments
        for (var n in defaults) {
            that[n] = defaults[n];
        }
        that.id = id;
        that.rootnode = rootnode;
        that.recording = recording;

        // timer info
        that.t = null;                       // absolute time maintained by the frameplayer
        that.game_tick = 0;                 // current game-tick as dictated by current state recording
        that.map_status_game_tick = -1;      // 

        // remember the sub-painters we need
        that.painter = painter;
        that.spritePainter = that.painter.subPainter('sprite');
        that.paintPainter = that.painter.subPainter('paint');
        that.beaconPainter = that.painter.subPainter('beacon');

        // app state
        that.speed = 20;
        that.mode = 'stopped';
        that.listeners = [];
        that.breakpoints = [];

        // that droids
        that.currentDroid = null;
        that.droids = {};

        // public API
        that.start = function(isStepping) {
            if(isStepping) {
                that.request = 'startStepping';
            } else {
                that.request = 'start';
            }
        };

        that.stop = function() {
            that.request = 'stop';
        };


        // movieplayers stop() sets frameplayer = null
        // runStop is never called, by just putting that.request = 'stop';
        that.stopHard = function() {
            runStop(that);
            changeMode(that,'stopped');
        };

        that.pause = function() {
            that.request = 'pause';
        };

        that.step = function() {
            that.request = 'step';
        };

        that.cont = function() {
            that.request = 'cont';
        };

        that.isPaused = function() {
            return that.mode == 'paused' || that.request == 'pause';
        }

        that.isFinished = function(){
            return !hasRemainingCommands(that);
        };

        that.clearBreakpoints = function() {
            that.breakpoints.splice(0,that.breakpoints.length)
        };
        that.addBreakpoint = function(lineno) {
            if(that.breakpoints.indexOf(lineno) < 0) {
                that.breakpoints.push(lineno);
            }
        };
        that.removeBreakpoint = function(lineno) {
            var idx = that.breakpoints.indexOf(lineno);
            if(idx >= 0) {
                that.breakpoints.splice(idx,1);
            }
        };
        that.hasBreakpoint = function(lineno) {
            return (that.breakpoints.indexOf(lineno) >= 0);
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

        that.currentGameTick = function() {
            return that.game_tick;
        }

        that.getCurrentRobo = function() {
            if(that.currentDroid) {
                return that.droids[that.currentDroid];
            } else {
                return null;
            }
        }

        /**
         * Return the duration of the current recording in milliseconds
         */
        that.getDuration = function() {
            return calculateDuration(that);
        };

        that.getSpeed = function() {
            return that.speed;
        };
        that.setSpeed = function(speed) {
            that.speed = speed;
        };

        that.remainingCommandTime = function(){
            return remainingCommandTime(that);
        };

        that.commandAnimationFinished = function(){
            return remainingCommandTime(that) === 0;
        };

        // sound effects
        that.sfx = {};
        // looping
        ['Ambient2'].map(function(snd){
            that.sfx[snd] = new Howl({
                // too big, mp3 only
                src: ['/site/sounds/'+snd+'.mp3'],
                autoplay : true,
                loop: true,
                volume: 0.7
            });
        });

        // looping
        ['Servo8','Servo7'].map(function(snd){
            that.sfx[snd] = new Howl({
                // WAV preferred over MP3
                src: ['/site/sounds/'+snd+'.wav','/site/sounds/'+snd+'.mp3'],
                autoplay : false,
                loop: true
            });
        });
        // once
        ['Beep1','Beep2','Beep3','Beep4','Beep5','Beep6','Beep7','Beep8','Beep9','Beep10',
            'Beep11','Beep12','Beep13','Clang1','BeepSuccess', 'BeepFail'].map(function(snd){
                that.sfx[snd] = new Howl({
                    // MP3 preferred over WAV
                    src: ['/site/sounds/'+snd+'.mp3','/site/sounds/'+snd+'.wav'],
                    autoplay : false,
                    loop: false
                });
            });


        that.currentSfx = null;

        /**
         * that.timerTick is expected to be called on a 50 ms (that.updateDuration)timer-tick and
         * drives a state machine with the following objects
         *    event: request =>  none|start|stop|pause|step|cont
         *    state: mode    =>  stopped|running|paused
         *    action:        =>  stepStart|stepComplete|stepForward
         */
        that.timerTick = function() {
            var request = that.request;
            that.request = 'none';
            switch(that.mode) {
                case 'stopped':
                    switch(request) {
                        case 'start':
                            runStart(that);
                            changeMode(that,'running');
                            break;
                        case 'startStepping':
                            runStart(that);
                            changeMode(that,'paused');
                            stepStart(that);
                            break;
                        case 'cont':
                            // we continue when commands are added (finish animation)
                            changeMode(that,'running');
                            break;
                    }
                    break;
                case 'running':
                    switch(request) {
                        case 'pause':
                            changeMode(that,'paused');
                            break;
                        case 'none':
                            stepForward(that, that.updateDuration*that.speed);
                            break;
                        case 'stop':
                            runStop(that);
                            changeMode(that,'stopped');
                            break;
                    }
                    break;
                case 'paused':
                    switch(request) {
                        case 'none':
                            stepComplete(that,that.updateDuration*that.speed);
                            break;
                        case 'step':
                            stepStart(that);
                            break;
                        case 'cont':
                            changeMode(that,'running');
                            break;
                        case 'stop':
                            runStop(that);
                            changeMode(that,'stopped');
                            break;
                    }
                    break;
                default:
                    console.log('unknown mode: ' + that.mode)
                    break;
            }
        }

        // callback (called by Robo) where it starts a command
        that.spriteStarted = function(rb,fromX, fromY, dx, dy) {
            if(rb.isPainting) {
                that.paintPainter.painterStarted(rb,rb.paintColor, fromX, fromY,dx,dy);
            }
        };

        // callback (called by Robo) called when the sprite moved
        that.spriteMoved = function(rb,fromX, fromY, toX, toY) {
           if(rb.isPainting) {
               that.paintPainter.painterMoved(rb,rb.paintColor, fromX, fromY, toX, toY);
            }
        };

        // callback (called by Robo) called when the current 'move' command has finished
        that.spriteStopped = function(rb,fromX, fromY, toX, toY) {
            if(rb.isPainting) {
                that.paintPainter.painterStopped(rb,rb.paintColor, fromX, fromY, toX, toY);
            }
        };

        // callback (called by Robo) called wheb the current command has finished
        that.spriteDone = function(rb) {
            that.beaconPainter.stopDroppingBeacon(rb);
            if(that.currentSfx && that.mode != 'running'){
                // end a (motor) sound after stepping
                that.currentSfx.stop();
                that.currentSfx = null;
            }
        }

        return that;
    };

    function changeMode(that, newmode) {
        that.mode = newmode;
        $(that.rootnode).triggerHandler('runmodechanged', {source:'frameplayer',oldmode:that.mode,newmode:newmode});
    }

    /*********************************************************************
     * Actions
     ********************************************************************/
    function runStart(that) {
        that.droids = {};
        that.droidsCommandTime = {};
        that.droidsCommandTimePassed = {};

        that.progcnt = 0;
        that.t = 0;            // current simulation time
        that.request = 'none'; //  none|start|stop|pause|step|cont
        that.mode = 'stopped'; // stopped|running|paused

        that.listeners.forEach(function(listener) {
            listener(that.id, 'startplay',{success: that.recording.success, messages:that.recording.messages});
        });
    }

    function runStop(that) {
        if(that.currentSfx){
            that.currentSfx.stop();
        }
        that.listeners.forEach(function(listener) {
            listener(that.id, 'stopplay',{success: that.recording.success, messages:that.recording.messages});
        });
    }

    /**
     * Start a new single command (one step), but don't do anything yet.
     * @param that
     */
    function stepStart(that) {
        if(hasRemainingCommands(that)) {
            startCommands(that);
        }
    }

    /**
     * Step forward a given amount of simulation time.
     * Each command has a duration stated in 'commandDuration'.
     * @param that
     * @param t  simulation time to step forward
     */
    function stepForward(that,tinc) {
        completeCommands(that, tinc);
        startCommands(that, tinc);
        progressCommands(that, tinc);
        if(!hasRemainingCommands(that)) {
            // the current command is completed and there are no more commands. go to stopped mode.
            changeMode(that,'stopped');
        }
        that.t = that.t + tinc;
    }

    /**
     * Complete the current outstanding commands, but don't start new commands.
     * @param that
     * @param t  time to spend trying to complete the command
     * @return true if the step is completed, false otherwise
     */
    function stepComplete(that, t) {
        var tinc = t;
        // eat up the available 'tinc' time with new commands until the commands can not be be completed
        var completable =(tinc > remainingCommandTime(that));
        if(completable) {
            // the current commands can be completed
            var duration = completeCommands(that);
            that.t = that.t + duration;
            return true; /// step is done
        } else {
            // the next command can not be completed, but only progressed
            progressCommands(that,tinc);
            that.t = that.t + tinc;
            return false;  // step is still not done
        }


    }

    /*********************************************************************
     * Support functions.
     ********************************************************************/

    function hasRemainingCommands(that) {
        return !that.recording.atEnd() || (Object.keys(that.droidsCommandTimePassed).length > 0);
    }

    /** calculate the remaining time for the current commands (time longest) **/
    function remainingCommandTime(that) {
        var result =0;
        for (var droidid in that.droidsCommandTimePassed) {
            var remaining = that.droidsCommandTime[droidid] - that.droidsCommandTimePassed[droidid];
            if(remaining > result) {
                result = remaining;
            }
        }
        return result;
    }

    /** complete the current commands **/
    function completeCommands(that, tinc) {
        for (var droidid in that.droidsCommandTimePassed) {
            let remaining = that.droidsCommandTime[droidid] - that.droidsCommandTimePassed[droidid];
            if(remaining <= tinc) {
                that.droids[droidid].completeCommand();
                delete that.droidsCommandTime[droidid];
                delete that.droidsCommandTimePassed[droidid];
            }
        }
    }

    /** given a time-unit 'tinc', progress current commands **/
    function progressCommands(that,tinc) {
        for (var droidid in that.droidsCommandTimePassed) {
            if(that.droidsCommandTimePassed[droidid] < that.droidsCommandTime[droidid]) {
                that.droidsCommandTimePassed[droidid] = that.droidsCommandTimePassed[droidid] + tinc;
                if(that.droidsCommandTimePassed[droidid] <= that.droidsCommandTime[droidid]) {
                    that.droids[droidid].progressCommand(that.droidsCommandTime[droidid],that.droidsCommandTimePassed[droidid]);
                }
            }
        }
    }

    /** start new commands (if/when they are available)
     * return: the number of commands started.
     * **/
    function startCommands(that) {
        let cnt_started = 0;
        if(!that.recording.atEnd() && that.recording.hasNext() && (that.recording.nextAt() <= that.t)) {
            // it is time to get the next frame (which will forward the recording)
            checkMapStatus(that);
            that.t = that.recording.nextAt();
            let frame = that.recording.getNext();
            if(frame) {
                for(let ix=0; ix < frame.length; ix++) {
                    cnt_started += 1;
                    let roboframe = frame[ix];
                    let robo_id = roboframe.sprite;
                    let command = roboframe.action[0];
                    let game_tick = roboframe.tick;
                    if(game_tick > that.game_tick) {
                        that.game_tick = game_tick;
                    }
                    if(!(robo_id in that.droids)) {
                        // unknown droid
                        let init_x = -1;
                        let init_y = -1;
                        let init_dir = -1;
                        if( command == 'crt') {
                            // it is a create command, create the droid object that can execute the frame/command
                            init_x = roboframe.action[3];
                            init_y = roboframe.action[4];
                            init_dir = roboframe.action[5];
                        } else {
                            // unknown droid, ask recording for last known info
                            let info = that.recording.spriteInfo(robo_id);
                            if(info) {
                                let pos = info.pos;
                                init_x = pos[0];
                                init_y = pos[1];
                                init_dir = info.dir;
                            }
                        }
                        if(init_x > 0) {
                            // an unknown bot with sufficient info. Create it.
                            let robo = $.fn.rm.robo(robo_id, that.recording, init_x, init_y, init_dir);
                            robo.addListener(that);
                            that.currentDroid = robo_id;
                            that.droids[robo_id] = robo;
                            that.droidsCommandTime[robo_id] = 0;
                            that.droidsCommandTimePassed[robo_id] = 0;
                            that.droids[robo_id] = robo;
                            that.spritePainter.addSprite(robo, function(t,sprite) {
                                // do we still need callback?
                            });
                        }
                    }
                    let robo = that.droids[robo_id];

                    if(robo) {
                        doNextCommand(that, robo, roboframe);
                    }
                }
            }
        }
        return cnt_started;
    }


    function checkMapStatus(that) {
        if(that.recording.hasMapStatus()) {
            let status_tick = that.recording.getMapStatusGameTick();
            // console.log("new status_tick: [" 
            //     + status_tick + "]->["
            //     + that.game_tick + "]->["
            //     + that.map_status_game_tick + "]"
            // );
            applyMapStatus(that, status_tick, that.recording.getMapStatus());
        } else {
            // console.log("no map_status");
        }
    }

    function applyMapStatus(that, status_tick, map_status) {
        // beacons
        let status_beacons = [];
        map_status['beaconLines'].forEach(function(line) {
            status_beacons.push([line.x, line.y]);
        });
        let beacons = that.beaconPainter.getBeacons();
        beacons.forEach(function(coord) {
            if(!status_beacons.includes(coord)) {
                that.beaconPainter.removeBeacon(coord[0], coord[1]);
            }
        });
        status_beacons.forEach(function(coord) {
            if(! beacons.includes(coord)) {
                that.beaconPainter.addBeacon(coord[0], coord[1]);
            }
        });
        // paint
        that.paintPainter.setPaintLines(map_status['paintLines']);
        // droids
        map_status['robotLines'].forEach(function(line) {
            // line: beacons/dir/id/x/y
            if(line['id'] in that.droids) {
                let dirix = Math.trunc(line['dir']/90) % 4;
                let dirs = ['right', 'up', 'left', 'down'];
                let droid = that.droids[line['id']];
                if(line['x']!=droid.currentX || line['y']!=droid.currentY) {
                    console.log(
                        "move droid:["
                        +droid.currentX +"]["
                        +droid.currentY +"]->["
                        +line['x'] + "]["
                        +line['y'] + "]");
                } else {
                    // console.log("droid on the correct place")
                }
                droid.setNextPosition(line['x'], line['y']);
                droid.setNextDirection(dirs[dirix]);
                droid.updateCurrent();
            }
        });
          
    }

    function doNextCommand(that, droid, frame) {
        // this is not yet compatible with multiple droids
        // inform listeners that a command is about to be executed
        that.listeners.forEach(function(listener) {
            listener(that.id, 'startcommand',{progcnt: that.progcnt, frame:frame});
        });

        var spriteId = frame.sprite;
        var srcLine = frame.src;
        var command = frame.action[0];
        var commandCnt = 1;
        var duration = commandDuration[command];
        if(command == 's' && frame.action[1] == 'front'){
            // override duration to be short for front looking actions
            duration *= 0.2;
        }
        if(command == 'f' || command == 'b' || command == 'l' || command == 'r') {
            commandCnt = frame.action[1]*1; // *1 necessary for casting to int!
            // add time to bump
            var bump = (command == 'f' || command == 'b') && (commandCnt < frame.action[2]*1);
            duration = Math.abs(duration*commandCnt) + (bump ? commandDuration['bump'] : 0);
        }

        // execute command
        performCommand(that,droid, command,frame.action, commandCnt); // this will issue the appropriate 'startCommand' calls to droid
        that.droidsCommandTime[droid.id] = duration;
        that.droidsCommandTimePassed[droid.id] = 0;
        that.progcnt++;
        let nextFrame = that.recording.peekNext(that.t);
        that.listeners.forEach(function(listener) {
            listener(that.id, 'endcommand',{progcnt: that.progcnt, frame:frame, nextframe:nextFrame});
        });

        // breakpoint
        if(nextFrame && nextFrame.src && that.hasBreakpoint(nextFrame.src)) {
            that.pause();
            $(that.rootnode).triggerHandler('runmodechanged', {intent:'pause',source:'frameplayer',oldmode:'running',newmode:'paused',nextframe: nextFrame});
        }
    }

    function calculateDuration(that) {
        that.recording.rewind();
        let totalDuration = 0;
        while(that.recording.hasNext()) {
            let frame_array = that.recording.getNext();
            let frame = frame_array[0];
            let command = frame.action[0];
            let duration = commandDuration[command];
            let commandCnt = 1;
            if(command === 's' && frame.action[1] === 'front'){
                // override duration to be short for front looking actions
                duration *= 0.2;
            }
            if(command === 'f' || command === 'b' || command === 'l' || command === 'r') {
                commandCnt = frame.action[1]*1; // *1 necessary for casting to int!
                // add time to bump
                let bump = (command === 'f' || command === 'b') && (commandCnt < frame.action[2]*1);
                duration = Math.abs(duration*commandCnt) + (bump ? commandDuration.bump : 0);
            }
            totalDuration = totalDuration + duration;
        }
        return totalDuration;
    }

    function performCommand(that,droid,command,action,amount) {

        var newSfx = null;
        var doBump = false;

        switch(command) {
            case 'crt':
                break;
            case 'des':
                if(!that.recording.atEnd()) {
                    that.spritePainter.removeSprite(droid);
                }
                that.recording.removeSprite(droid.id);
                break;
            case 'f':
                doBump = amount < (action[2] * 1);
                var bumpDuration = doBump ? commandDuration['bump'] : 0;
                droid.forward(amount, bumpDuration);
                newSfx =  that.sfx['Servo8'];
                break;
            case 'b':
                doBump = amount < (action[2] * 1);
                var bumpDuration = doBump ? commandDuration['bump'] : 0;
                droid.backward(amount, bumpDuration);
                newSfx = that.sfx['Servo7'];
                break;
            case 'l':
                droid.rotateLeft(amount);
                newSfx = that.sfx['Servo7'];
                break;
            case 'r':
                droid.rotateRight(amount);
                newSfx = that.sfx['Servo7'];
                break;
            case 's':
                var subject = action[2];
                droid.see(action[1],subject);
                switch (subject){
                    case 'obstacle':newSfx = that.sfx['Beep1']; break;
                    case 'clear':   newSfx = that.sfx['Beep2'];break;
                    case 'beacon':  newSfx = that.sfx['Beep3'];break;
                    case 'white':   newSfx = that.sfx['Beep4'];break;
                    case 'black':   newSfx = that.sfx['Beep5'];break;
                }

                break;
            case 'gg':
            case 'ge':
                droid.gripperGet(action[1]);
                if(action[1] == 'success') {
                    var x = droid.currentX;
                    var y = droid.currentY;
                    switch(droid.currentDir) {
                        case 'up':
                            y = y -1;
                            break;
                        case 'down':
                            y = y + 1;
                            break;
                        case 'left':
                            x = x -1;
                            break;
                        case 'right':
                            x = x + 1;
                            break;
                    }
                    that.beaconPainter.removeBeacon(x,y);
                    newSfx = that.sfx['Beep6'];
                }

                break;
            case 'gp':
                droid.gripperPut(action[1]);
                if(action[1] == 'success') {
                    var x = droid.currentX;
                    var y = droid.currentY;
                    switch(droid.currentDir) {
                        case 'up':
                            y = y -1;
                            break;
                        case 'down':
                            y = y + 1;
                            break;
                        case 'left':
                            x = x -1;
                            break;
                        case 'right':
                            x = x + 1;
                            break;
                    }
                    that.beaconPainter.startDroppingBeacon(droid,x,y);
                    newSfx = that.sfx['Beep7']
                    // that.beaconPainter.addBeacon(x,y);
                }
                break;
            case 'pw':
                droid.paintWhite(action[1]);
                that.paintPainter.startPaint('white',droid.currentX,droid.currentY);
                newSfx = that.sfx['Beep8']
                break;
            case 'pb':
                droid.paintBlack(action[1]);
                that.paintPainter.startPaint('black',droid.currentX,droid.currentY);
                newSfx = that.sfx['Beep8']
                break;
            case 'sp':
                droid.stopPainting(action[1]);
                newSfx = that.sfx['Beep12']
                break;
            case 'fc':
                droid.flipCoin();
                newSfx = that.sfx['Beep11']
                break;
            case 'shi':
                that.rootnode.setWorldMessage((action[1] * 1));
                break;
            case 'sht':
                that.rootnode.setWorldMessage(action[1]);
                break;
            case 'happy':
                droid.happyTurn();
                newSfx = that.sfx['BeepSuccess']
                break;
            case 'nonono':
                droid.nonono();
                newSfx = that.sfx['BeepFail']
                break;
            default:
                //console.log('unknown command: ' + command);
                break;
        }

        // update sound effects

        if(that.doBump){
            that.sfx['Clang1'].play();
        }
        that.doBump = doBump;

        if(!newSfx){
            // no new sound
            if(that.currentSfx){
                that.currentSfx.stop();
            }
            that.currentSfx = null;
        }
        else{
            if(that.currentSfx && newSfx._src == that.currentSfx._src && newSfx._loop){
                // same sound, do nothing
                // console.log('sfx continue : ' + newSfx._src )
            }
            else {
                // change sound
                if(that.currentSfx){
                    that.currentSfx.stop();
                }
                that.currentSfx = newSfx;
                // console.log('sfx start :' + that.currentSfx._src);
                that.currentSfx.play();
            }
        }

    }

})(jQuery);



