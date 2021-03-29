'use strict';
(function($) {

    var defaults = {
        'id':'0',
        updateDuration:50
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.rm = {}
    $.fn.robotjes = {};
    $.fn.robotjes.robotjesviewer = function(node) {
        let that = {};
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.skin = null;
        that.images = {}
        that.movieplayer = null;
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0
        that.recordingDelta = (5*1000)/50;  // every 5 seconds (in sync with status_keeper)

        that.recordingTimer = function(timerTick) {
            doRecordingTimer(that, timerTick);
        };

        that.statusTimer = function(timerTick) {
            doStatusTimer(that, timerTick);
        }

        that.movieplayerTimer = function(timerTick) {
            if(that.movieplayer) {
                that.movieplayer.timerTick(timerTick);
            }
        }

        populate(that);
        return that;
    }

    function populate(that) {
        that.node.on('runmodechanged', function(event, data) {
            var newmode = data.newmode;
            // console.log("old: " +data.oldmode + "->" + "new: " + data.newmode + "\n");
            if(data.oldmode === "stopped" && data.newmode === "running") {
                $.post("/game/stopped2running")
                    .then(function() {
                    })
            } else if(data.oldmode === "running" && data.newmode === "stopped") {
                $.post("/game/running2stopped")
                    .then(function() {
                    })
            } else if(data.oldmode === "running" && data.newmode === "paused") {
                $.post("/game/running2paused")
                    .then(function() {
                    })
            } else if(data.oldmode === "paused" && data.newmode === "running") {
                $.post("/game/paused2running")
                    .then(function() {
                    })
            }
            return true;
        });
        that.timerListeners = [];
        that.timerListeners.push(that.recordingTimer);
        that.timerListeners.push(that.statusTimer);
        that.timerListeners.push(that.movieplayerTimer);
        startTimer(that)
        return that;
    }

    function init_game(that, game_id) {
        $.getJSON("/challenge/skin")
            .then(function(skin) {
                that.skin = skin;
                return $.getJSON("/challenge/map")
                    .done(function (result) {
                        that.map = result[1]["results"]["map"];
                    })
            })
            .then(function() {
                return new Promise((resolve, reject) => {
                    var count = 0;
                    for (const [key, path] of Object.entries(that.skin)) {
                        count++;
                        var image = document.createElement("img");
                        image.onload = function () {
                            count--;
                            if (count <= 0) {
                                resolve(that.images);
                            }
                        };
                        image.onerror = function(evt) {
                            count--;
                            if(count<=0) {
                                reject(that.images);
                            }
                        }
                        that.images[key] = image
                        image.src = path;
                    }
                });
            })
            .then(function(images) {
                var moviePlayerNode = $('<div id="worldpane" class="worldpane" ><div id="worldsubpane" style="height: 100%; width: 100%;" class="animation"></div></div>');
                that.movieplayer =  $.fn.rm.movieplayer('movieplayer1',moviePlayerNode.find('#worldsubpane'), that.node, that.skin,that.images);
                that.node.append(moviePlayerNode);
                that.node.resize();
                that.recording  =  $.fn.rm.recording(that.map, that.skin,that.images);
                that.recording.setDeltaFrames(game_id);
                that.movieplayer.start(that.recording, false, false);
                // loadMap(that)
            })
    }

    function exit_game(that) {
        that.node.empty();
    }

    function loadMap(that) {
        $.getJSON("/challenge/map")
            .then(function(skin) {
                that.skin = skin;
                return $.getJSON("/challenge/map")
                    .done(function (response) {
                        let recording_json = response[1].results;
                        let recording = createRecording(that, recording_json);
                        that.recording = recording
                        that.movieplayer.start(recording, false, false);
                    })
            })
    }

    function createRecording(that, recording_json) {
        let recording =  $.fn.rm.recording(recording_json.map, that.skin,that.images);
        let frames = [];
        if(recording_json.recording != null) {
            frames = $.extend(true, [], recording_json.recording.keyFrames);  // deep copy of keyFrames
        }
        let robotLine = recording.robotLines()[0];
        let init_x = robotLine.x;
        let init_y = robotLine.y;
        let init_dir = 'up';
        recording.success = recording_json.success;
        recording.hint = recording_json.hint;
        recording.profile = recording_json.profile;
        recording.messages = recording_json.messages;
        recording.setAllFrames(frames, init_x, init_y, init_dir);
        return recording;
    }

    function doStatusTimer(that, timerTick) {
        if((timerTick % 100) == 0) {
            $.getJSON("/games")
                .then(function(result) {
                    let game_id = null;
                    let game_name = null;
                    for (const [key, value] of Object.entries(result)) {
                        game_id = key;
                        game_name = value;
                    }
                    if(that.game_id && (!game_id || (game_id != that.game_id))) {
                        exit_game(that, that.game_id);
                    }
                    if(game_id && (game_id!=that.game_id)) {
                        that.game_id = game_id;
                        that.game_name = game_name;
                        init_game(that, game_id);
                    }
                })
        }
    }

    function doRecordingTimer(that, timerTick) {
        if(timerTick % that.recordingDelta === 0) {
            if(that.game_id) {
                that.recording.timer(timerTick);
            }
        }
    }

    function startTimer(that) {
        stopTimer(that);
        that.timerTicks = 0;
        that.timer = setInterval(function() {
            tickTimer(that, that.timerTicks);
            that.timerTicks++;
        },that.updateDuration);
    }

    function stopTimer(that) {
        if(that.timer != null) {
            clearInterval(that.timer);
            that.timer = null;
        }
    }

    function tickTimer(that, timerTick) {
        that.timerListeners.forEach( function(listener) {
            listener(timerTick);
        });
    }

})(jQuery);