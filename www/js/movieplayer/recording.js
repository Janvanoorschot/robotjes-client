/*
 * Copyright (c) 2013/2020 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Decorator around the recording returned by the Robomind Site.
 *
 * @author jan
 * @since GOL1.0
 */
(function($) {
    "use strict";
    /*global jQuery */


    let defaults = {
        mapWidth:10,
        mapHeight:10,
        tileSize:200
    };

    /**
     * Represents a recording including maps, images and frames
     */
    $.fn.rm.recording = function(map,skin,images) {
        let that = {};

        // set data (defaults and constructor args)
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        // public properties
        that.map = map;
        that.skin = skin;
        that.images = images;
        that.success = true;
        that.messages = [];
        that.hint = [];
        that.profile = {};
        that.frames = null;


        // initialise the recording
        determineMapSize(that);
        determineTileSize(that);

        that.setAllFrames = function(frames, init_x, init_y, init_dir) {
            that.frames = $.fn.rm.classicframeholder(that.map, frames, init_x, init_y, init_dir, that.success);
        };

        that.setDeltaFrames = function(game_id) {
            that.frames = $.fn.rm.fieldframeholder(game_id);
        };

        that.dump = function(sprite_id) {
            if(that.frames) {
                return that.frames.dump(sprite_id);
            } else {
                throw new Error("frames not set");
            }
        };

        that.spriteInfo = function(sprite_id) {
            if(that.frames) {
                return that.frames.spriteInfo(sprite_id);
            } else {
                throw new Error("frames not set");
            }
        };

        that.atEnd = function() {
            if(that.frames) {
                return that.frames.atEnd();
            } else {
                throw new Error("frames not set");
            }
        };

        that.hasNext = function() {
            if(that.frames) {
                return that.frames.hasNext();
            } else {
                throw new Error("frames not set");
            }
        };

        that.nextAt = function() {
            if(that.frames) {
                return that.frames.nextAt();
            } else {
                throw new Error("frames not set");
            }
        };

        that.peekNext = function() {
            if(that.frames) {
                return that.frames.peekNext();
            } else {
                throw new Error("frames not set");
            }
        };

        that.getNext = function() {
            if(that.frames) {
                return that.frames.getNext();
            } else {
                throw new Error("frames not set");
            }
        };

        that.getMapStatusGameTick = function() {
            if(that.frames) {
                return that.frames.getMapStatusGameTick();
            } else {
                throw new Error("frames not set");
            }
        }

        that.hasMapStatus = function() {
            if(that.frames) {
                return that.frames.hasMapStatus();
            } else {
                throw new Error("frames not set");
            }
        }

        that.getMapStatus = function() {
            if(that.frames) {
                return that.frames.getMapStatus();
            } else {
                throw new Error("frames not set");
            }
        }

        that.rewind = function() {
            if(that.frames) {
                return that.frames.rewind();
            } else {
                throw new Error("frames not set");
            }
        };

        that.timer = function(timerTick) {
            if(that.frames) {
                return that.frames.timer(timerTick);
            } else {
                throw new Error("frames not set");
            }
        };

        that.removeSprite = function(sprite_id) {
            if(that.frames) {
                return that.frames.removeSprite(sprite_id);
            } else {
                throw new Error("frames not set");
            }
        };
        that.beaconLines = function() {
            if(that.frames) {
                return that.frames.beaconLines();
            } else {
                throw new Error("frames not set");
            }
            // return that.map.beaconLines;
        };
        that.paintLines = function() {
            if(that.frames) {
                return that.frames.paintLines();
            } else {
                throw new Error("frames not set");
            }
            // return that.map.paintLines;
        };
        that.robotLines = function() {
            if(that.frames) {
                return that.frames.robotLines();
            } else {
                throw new Error("frames not set");
            }
            // return that.map.robotLines;
        };

        that.mapLines = function() {
            return that.map.mapLines;
        };
        that.extraLines = function() {
            return that.map.extraLines;
        };
        that.imageDefs = function() {
            return that.map.images;
        };
        that.hasErrors = function() {
            var errors = _.filter(that.messages, function(m){return m.type === "error";});
            return !_.isEmpty(errors);
        };

        that.center = function () {
            if(that.map.robotLines.length > 0) {
                var robotLine = that.map.robotLines[0]
                return [robotLine.x, robotLine.y];
            } else {   
                return [that.mapWidth/2, that.mapHeight/2];
            }
        };

        that.getEndScore = function () {
            var score = 0;
            if (that.frames && that.frames.length > 0) {
                var nframes = that.frames.length;
                var lastFrame = that.frames[nframes - 1];
                if ('score' in lastFrame) {
                    score = lastFrame.score;
                } else if (that.frames && that.frames.length > 1) {
                    // try one-but-last frame, because a nonono or happy action may be appended
                    lastFrame = that.frames[nframes - 2];
                    if ('score' in lastFrame) {
                        score = lastFrame.score;
                    }
                }
            }
            return score;
        };

        // return the completed object
        return that;
    };


    function determineMapSize(that) {
        if((that.map.mapLines && that.map.mapLines.length>0 &&that.map.mapLines[0].length>0)) {
            that.mapWidth = that.map.mapLines[0].length;
            that.mapHeight = that.map.mapLines.length;
        } else {
            that.mapWidth = 0;
            that.mapHeight = 0;
        }
    }

    function determineTileSize(that) {
        // in the future we should read the file 'skin.properties' in the skin, for now we use the width of tile-@
        var defaultImage = that.images["tile-@"];
        that.tileSize = defaultImage.width;
    }

    $.fn.rm.classicframeholder = function(map, recframes, init_x, init_y, init_dir, success) {

        var that = {};

        that.map = map;
        let botname = "r";
        if(recframes && recframes.length>0) {
            botname = recframes[0].sprite;
        }

        // The frames blob in a recording is an array of a frames.
        // Currently one frame is an array of droid-frames.
        // A droid-frame is a dictionary containing droid-id, action, src and score. (this can change later)
        that.frames = [];
        // classic recording do not include a 'create-bot' instruction ... add it.
        that.frames.push([{
            "sprite": botname,
            "action": ['crt', botname, "normal", init_x, init_y, init_dir],
            "src":0,
            "score": 0
        }]);
        for(let ix=0; ix<recframes.length; ix++) {
            that.frames.push([recframes[ix]]);
        }
        if(recframes.length > 0) {
            if(success) {
                that.frames.push([{
                    "sprite": botname,
                    "action": ['happy'],
                    "src":0,
                    "score": 0
                }]);
            } else {
                that.frames.push([{
                    "sprite": botname,
                    "action": ['nonono'],
                    "src":0,
                    "score": 0
                }]);
            }
        }
        // classic recording do not include a 'destroy-bot' instruction ... add it.
        that.frames.push([{
            "sprite": botname,
            "action": ['des', botname],
            "src":0,
            "score": 0
        }]);

        // a classic-frame starts at 0 (time and frame-in-recording/ptr)
        that.next_t = 0;
        that.ptr = 0;

        that.dump = function(sprite_id) {

        };

        that.spriteInfo = function(sprite_id) {
            return {
                "player": "player",
                "pos": [init_x,init_y],
                "dir": init_dir
            };
        };

        that.atEnd = function() {
            return that.ptr >= that.frames.length;
        };

        that.hasNext = function() {
            return that.ptr < that.frames.length;
        };

        that.nextAt = function() {
            return that.next_t;
        };

        that.peekNext = function() {
            if(that.hasNext()) {
                let frame = that.frames[that.ptr];
                return frame;
            } else {
                return [];
            }
        };

        that.getNext = function() {
            if(that.hasNext()) {
                let frame = that.frames[that.ptr++];
                that.next_t = that.next_t + doCalcFrameDuration(frame);
                return frame;
            } else {
                throw new Error("getting frame beyond recording capacity");
            }
        };

        that.getMapStatusGameTick = function() {
            // there is only one mapstatus, and it is available at the startg time 0
            return 0;
        }

        that.hasMapStatus = function() {
            // return the mapstatus available from the original 
            // ToDo: implement
            return false;
        }

        that.getMapStatus = function() {
            // return the mapstatus available from the original 
            // ToDo: implement
            return []
        }

        that.rewind = function() {
            that.ptr = 0;
            that.next_t = 0;
        };

        that.timer = function(timerTick) {
            // noop
        };

        that.removeSprite = function(sprite_id) {
            // noop in classic recording
        };

        that.beaconLines = function() {
            return that.map.beaconLines;
        };
        that.paintLines = function() {
            return that.map.paintLines;
        };
        that.robotLines = function() {
            return that.map.robotLines;
        };

        function doCalcFrameDuration(frame) {
            /** Calculate the duration of a frame. This is the
             * maximum duration of the droid-frames contained in this frame.
             */
            let duration = 0;
            for(var i = 0; i < frame.length; i++) {
                let droid_frame = frame[i];
                let cmd = droid_frame.action[0];
                let sub_duration = $.fn.rm.commandDuration[cmd];
                if(cmd in $.fn.rm.argCommands) {
                    let cnt = parseInt(droid_frame.action[1]);
                    sub_duration = sub_duration*cnt;
                }
                if(sub_duration > duration) {
                    duration = sub_duration;
                }
            }
            return duration;
        }

        // return the completed object
        return that;
    };

    // list of deltas
    // -------------------------------------------------------------
    // array(10) [
    //    {
    //      game_tick = 4950
    //      frames = array(5) [
    //        [
    //          {
    //            action:     Array(6) [crt, 93c15a67-0913-41d0-8af7-f8fbdef48940, normal, 7, 11, up]
    //            ix:         4402
    //            tick:       5152
    //            sprite:     93c15a67-0913-41d0-8af7-f8fbdef48940
    //            src:        0
    //            score:      4402
    //          }
    //        ],
    //        ...
    //      ]
    //      map_status = {
    //        paintLines = Array[]
    //        robotLines = Array[]
    //        beaconLines = Array[]
    //        game_time = 5150
    //      }
    //    },
    //    ...
    // ]
    $.fn.rm.fieldframeholder = function(game_id) {
        let that = {};
        that.game_id = game_id;
        // the following state is maintained during creation/appendDelta
        that.before_game_time = 0;           // the game_time of the last delta added
        that.deltas = [];                    // ordered list of deltas
        that.cur_delta_ix = -1;              // current delta
        that.cur_frame_ix = -1;              // current/next frame in current delta
        that.map_status = null;              // current valid game_status
        that.has_map_status = null;          // true iff there is a valid game_status
        that.map_status_game_tick = -1;      // timestamp of current valid game_status

        // the following data in maintained during creation/rewind/getNext
        that.sprites = {};                   // sprites that currently (that.ptr) occur in the recording
        that.next_t = 0;                     // t of the next frame
        that.first_tick = -1;                // first tick of the field playback
        that.last_added_tick = -1;           // tick of the last added frame (only add newer frames (ie higher tick))

        that.dump = function(sprite_id) {
            let robotLines = that.deltas[that.cur_delta_ix-1].map_status.robotLines;
            for(let ix =0; ix < robotLines.length; ix++) {
                let entry = robotLines[ix];
                if (sprite_id === entry.id) {
                    let dir = 'up';
                    switch (entry.dir) {
                        case 0:
                            dir = 'right';
                            break;
                        case 90:
                            dir = 'up';
                            break;
                        case 180:
                            dir = 'left';
                            break;
                        default:
                            dir = 'down';
                            break;
                    }
                    return "delta["
                        + t2tick(that, that.next_t)
                        + "][" + that.deltas[that.cur_delta_ix-1].map_status.game_time
                        + "][" + sprite_id
                        + "]=[" + entry.x
                        + "," + entry.y
                        + "][" + dir
                        + "]";
                }
            }
            return "?????";
        };

        that.spriteInfo = function(sprite_id) {
            // we only have sprite-info at the start of a delta;
            if(that.cur_delta_ix>=1 && that.cur_frame_ix === 1) {
                // find the sprite in the map_status of the current delta
                let robotLines = that.deltas[that.cur_delta_ix-1].map_status.robotLines;
                for(let ix =0; ix < robotLines.length; ix++)  {
                    let entry = robotLines[ix];
                    if(sprite_id === entry.id) {
                        let dir = 'up';
                        switch(entry.dir) {
                            case 0:
                                dir = 'right';
                                break;
                            case 90:
                                dir = 'up';
                                break;
                            case 180:
                                dir = 'left';
                                break;
                            default:
                                dir='down';
                                break;
                        }
                        return  {
                            "spite": sprite_id,
                            "pos": [entry.x, entry.y],
                            "dir": dir,
                            "load": entry.beacons,
                            "next_t":that.next_t,
                            "game_time": tick2t(that, that.deltas[that.cur_delta_ix-1].game_tick)
                        };
                    }
                }
            }
            return null;
        };

        that.atEnd = function() {
            return false;
        };

        that.hasNext = function() {
            return !that.atEnd();
        };

        that.nextAt = function() {
            return that.next_t;
        };

        that.peekNext = function() {
            // no peeking in field
            return null;
        };

        that.getNext = function() {
            let multiframe = doCalcNextFieldFrame(that);
            that.next_t = that.next_t + 1000;
            return multiframe;
        };

        that.getMapStatusGameTick = function() {
            // there is only one mapstatus, and it is available at the startg time 0
            return that.map_status_game_tick;
        }

        that.hasMapStatus = function() {
            return that.has_map_status;
        }

        that.getMapStatus = function() {
            return that.map_status;
        }

        that.rewind = function() {
            // think about it
        };

        that.addSprite = function(sprite_id) {
            that.sprites[sprite_id] = {};
        };

        that.removeSprite = function(sprite_id) {
            delete that.sprites[sprite_id];
        };

        that.beaconLines = function() {
            return [];
        };
        that.paintLines = function() {
            return [];
        };
        that.robotLines = function() {
            return [];
        };

        that.timer = function(timerTick) {
            doTimer(that, timerTick);
        };

        function tick2t(that, tick) {
            return (tick - that.first_tick)*1000;
        }

        function F(that, t) {
            return that.first_tick + Math.floor(t/1000);
        }

        function doFirstDelta(that, delta) {
            let lst = doGetDeltas(that);
            doAddDeltas(that, lst, true);
            that.cur_delta_ix = 0; // not 0, we do not want the first one that has no map-status
            that.cur_frame_ix = 0;
            // initialise first_tick
            if(lst.length>0) {
                if(lst[0].frames.length > 0) {
                    that.first_tick = lst[0].frames[0][0].tick;
                } else {
                    that.first_tick = lst[0].game_tick;
                }
                // initialise map_status
                that.map_status = lst[0].map_status;
                that.map_status_game_tick = lst[0].game_tick;
                that.has_map_status = true;
            } else {
                that.first_tick = 0;
                that.has_map_status = false;
            }
        }

        function doTimer(that, timerTick) {
            let lst = doGetDeltas(that);
            doAddDeltas(that, lst, false);
        }

        function doGetDeltas(that) {
            if(that.game_id) {
                let map = null;
                let url = '/field/gamerecording?game_id=' + that.game_id+"&before_game_time="+that.before_game_time;
                $.ajax({
                    url: url,
                    async: false,
                    dataType: 'json',
                    success: function (response) {
                        map = response;
                        if(map.length > 0) {
                            that.before_game_time = map[map.length-1].game_tick;
                        }
                    },
                    error: function(jqXHR,type,e) {
                        console.error("loading recording failed");
                    }
                });
                return map;
            }
        }

        function doAddDeltas(that, lst) {
            // add the new deltas
            for(let ix=0; ix < lst.length; ix++) {
                that.deltas.push(lst[ix]);
            }
        }

        function doCalcNextFieldFrame(that) {
            let frame = null;
            if(that.cur_delta_ix < that.deltas.length) {
                // there is a delta (frames+mapstatus) available
                if(that.cur_frame_ix < that.deltas[that.cur_delta_ix].frames.length) {
                    // the frame-counter points in the current delta
                    frame = that.deltas[that.cur_delta_ix].frames[that.cur_frame_ix];
                    that.cur_frame_ix++;
                    if(that.cur_frame_ix>= that.deltas[that.cur_delta_ix].frames.length) {
                        // we can and should switch to the next delta. This means
                        // we have a new map-status. 
                        that.map_status = that.deltas[that.cur_delta_ix].map_status;
                        that.map_status_game_tick = that.deltas[that.cur_delta_ix].game_tick;
                        that.has_map_status = true;
                        // switch to next delta
                        that.cur_delta_ix++;
                        that.cur_frame_ix = 0;
                        // remove old deltas
                        let removed = that.deltas.splice(0, that.cur_delta_ix-1);
                        that.cur_delta_ix -= removed.length;
                    } else {
                        that.has_map_status = false;
                    }
                } else {
                    that.cur_delta_ix++;
                    that.cur_frame_ix = 0;
                    that.has_map_status = false;
                }
            }
            if(frame) {
                let donebots = {};
                for(let droid_frame in frame) {
                    donebots[droid_frame.sprite] = {};
                    if(droid_frame.action==='crt') {
                        that.addSprite(droid_frame.sprite);
                    } else if(droid_frame.action==='des') {
                        that.removeSprite(droid_frame.sprite);
                    }
                }
                // insert NOOP's for sprites that have no frame yet
                for (const [sprite_id, value] of Object.entries(that.sprites)) {
                    if(!(sprite_id in donebots)) {
                        frame.push({
                            "action": ["s","left",0],
                            "ix": 0,
                            "tick": that.next_t,
                            "sprite": sprite_id,
                            "src": 0,
                            "score": 0
                        });
                    }
                }
            }
            return frame;
        }

        doFirstDelta(that);

        return that;
    };


})(jQuery);
