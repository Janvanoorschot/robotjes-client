'use strict';
(function ($) {

    var defaults = {
        'id': '0',
        updateDuration: 50       // timer tick every 50 ms (20 times per second)>
    };

    /**
     * Functional constructor for robo.
     */
    $.fn.robotjes.robotjesviewer = function (statusnode, node, game_id, player_id, url="") {
        let that = {};
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.statusnode = statusnode;
        that.node = node;
        that.game_id = game_id;
        that.player_id = player_id;
        that.url = url;

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
        };

        that.movieplayerTimer = function (timerTick) {
            if (that.movieplayer) {
                that.movieplayer.timerTick(timerTick);
            }
        };

        populate(that);
        init_game(that, that.game_id);

        return that;
    };

    function populate(that) {
        that.node.on('runmodechanged', function (event, data) {
            var newmode = data.newmode;
            if (data.oldmode === "stopped" && data.newmode === "running") {
                $.post(`${that.url}/game/stopped2running`)
                    .then(function () {
                    })
            } else if (data.oldmode === "running" && data.newmode === "stopped") {
                $.post(`${that.url}/game/running2stopped`)
                    .then(function () {
                    })
            } else if (data.oldmode === "running" && data.newmode === "paused") {
                $.post(`${that.url}/game/running2paused`)
                    .then(function () {
                    })
            } else if (data.oldmode === "paused" && data.newmode === "running") {
                $.post(`${that.url}/game/paused2running`)
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
            .then((skin) => {
                that.skin = skin;
                let url = `${that.url}/game/${game_id}/map`;
                return $.getJSON(url)
                    .done((result) => {
                        that.map = result['maze_map'];
                    })
                    .fail((result) => {
                        console.log(`error: ${result}`);
                    });
            })
            .then(function () {
                // return new Promise((resolve, reject) => {
                new Promise((resolve, reject) => {
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
                        };
                        that.images[key] = image;
                        image.src = path;
                    }
                })
                    .then((images) => {
                        var moviePlayerNode =
                            $('<div id="worldpane" class="worldpane" ><div id="worldsubpane" class="animation"></div></div>');
                        that.movieplayer = $.fn.rm.movieplayer(
                            'movieplayer1',
                            moviePlayerNode.find('#worldsubpane'),
                            that.node,
                            that.skin,
                            that.images);
                        that.node.append(moviePlayerNode);

                        // get the center options
                        var centerx = $.fn.rm.sessionstate['centerx'];
                        var centery = $.fn.rm.sessionstate['centery'];
                        var centerzoom = $.fn.rm.sessionstate['centerzoom'];
                        if(centerx && centerx>0 && centery && centery>0 && centerzoom && centerzoom>0) {
                            that.movieplayer.setCenter(centerx,centery,centerzoom);
                        }

                        that.node.resize();
                        that.recording = $.fn.rm.recording(that.map, that.skin, that.images);
                        that.recording.setDeltaFrames(game_id, that.url);
                        that.movieplayer.start(that.recording, false, false);
                        return images;
                    });
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
        stopTimer(that);
    }

    function doWaitForGameDestruction(that, timerTick, game_id) {
        if ((timerTick % 100) == 0) {
            $.getJSON(`${that.url}/game/${that.game_id}/status`)
                .then(function (result) {
                    update_game(that, result);
                }, error => {
                    // game disappeared 
                    exit_game(that, that.game_id);
                });
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