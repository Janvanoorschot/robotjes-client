'use strict';
(function ($) {

    var defaults = {
        'id': '0',
        updateDuration: 50       // timer tick every 50 ms (20 times per second)>
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.robotjes.robotjesviewer = function (node, game_id, player_id) {
        let that = {};
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.game_id = game_id;
        that.player_id = player_id;

        that.skin = null;
        that.map = null;
        that.images = {};
        that.movieplayer = null;
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        that.recordingDelta = (5 * 1000) / 50;  // get recording-delta every 5 seconds (in sync with status_keeper)

        that.recordingTimer = function (timerTick) {
            doRecordingTimer(that, timerTick);
        };

        that.statusTimer = function (timerTick) {
            doWaitForGameDestruction(that, timerTick, that.game_id);
        }

        that.movieplayerTimer = function (timerTick) {
            if (that.movieplayer) {
                that.movieplayer.timerTick(timerTick);
            }
        }

        populate(that);
        init_game(that, that.game_id);

        return that;
    };

    function populate(that) {
        that.node.on('runmodechanged', function (event, data) {
            var newmode = data.newmode;
            // console.log("old: " +data.oldmode + "->" + "new: " + data.newmode + "\n");
            if (data.oldmode === "stopped" && data.newmode === "running") {
                $.post("/game/stopped2running")
                    .then(function () {
                    })
            } else if (data.oldmode === "running" && data.newmode === "stopped") {
                $.post("/game/running2stopped")
                    .then(function () {
                    })
            } else if (data.oldmode === "running" && data.newmode === "paused") {
                $.post("/game/running2paused")
                    .then(function () {
                    })
            } else if (data.oldmode === "paused" && data.newmode === "running") {
                $.post("/game/paused2running")
                    .then(function () {
                    })
            }
            return true;
        });
        that.timerListeners = [];
        that.timerListeners.push(that.recordingTimer);
        that.timerListeners.push(that.statusTimer);
        that.timerListeners.push(that.movieplayerTimer);
        startTimer(that);
        return that;
    }

    function init_game(that, game_id) {
        $.getJSON("/challenge/skin")
            .then(function (skin) {
                that.skin = skin;
                let url = `/game/${game_id}/map`;
                return $.getJSON(url)
                    .done(function (result) {
                        that.map = result['maze_map'];
                    })
            })
            .then(function () {
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
                        image.onerror = function (evt) {
                            count--;
                            if (count <= 0) {
                                reject(that.images);
                            }
                        }
                        that.images[key] = image
                        image.src = path;
                    }
                });
            })
            .then(function (images) {
                var moviePlayerNode = $('<div id="worldpane" class="worldpane" ><div id="worldsubpane" style="height: 100%; width: 100%;" class="animation"></div></div>');
                that.movieplayer = $.fn.rm.movieplayer('movieplayer1', moviePlayerNode.find('#worldsubpane'), that.node, that.skin, that.images);
                that.node.append(moviePlayerNode);
                that.node.resize();
                that.recording = $.fn.rm.recording(that.map, that.skin, that.images);
                that.recording.setDeltaFrames(game_id);
                that.movieplayer.start(that.recording, false, false);
            })
    }

    function update_game(that, status) {
        // $.fn.genmon(MONTYPE_GAMETICK, MONMSG_SERVER, status["status"]["game_tick"]);
        var player_game_tick = "";
        for (var $player in status["players"]) {
            player_game_tick = status["players"][$player]["game_tick"];
        }
        // $.fn.genmon(MONTYPE_GAMETICK, MONMSG_SOLUTION, player_game_tick);
    }

    function exit_game(that) {
        that.node.empty();
    }

    function doWaitForGameDestruction(that, timerTick, game_id) {
        if ((timerTick % 100) == 0) {
            $.getJSON(`/bubble/game/${that.game_id}/status`)
                .then(function (result) {
                    update_game(that, result);
                }, error => {
                    // game disappeared 
                    exit_game(that, that.game_id);
                })
        }
    }

    function doRecordingTimer(that, timerTick) {
        if (timerTick % that.recordingDelta === 0) {
            if (that.game_id && that.recording) {
                that.recording.timer(timerTick);
            }
        }
    }

    function startTimer(that) {
        stopTimer(that);
        that.timerTicks = 0;
        that.timer = setInterval(function () {
            tickTimer(that, that.timerTicks);
            that.timerTicks++;
        }, that.updateDuration);
    }

    function stopTimer(that) {
        if (that.timer != null) {
            clearInterval(that.timer);
            that.timer = null;
        }
    }

    function tickTimer(that, timerTick) {
        that.timerListeners.forEach(function (listener) {
            listener(timerTick);
        });
    }

})(jQuery);