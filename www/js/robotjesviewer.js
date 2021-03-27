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

        that.start = function () {

        }

        that.stop = function () {

        }

        populate(that);

        return that;
    }

    function populate(that) {
        $.getJSON("/challenge/skin")
            .then(function(skin) {
                that.skin = skin;
                return $.getJSON("/challenge/map")
                    .done(function (map) {
                        that.map = map;
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
                that.timerListeners.push(that.movieplayer);
                loadMap(that)
                startTimer(that)
            })

        // that.node.on('runmodechanged', function(event, data) {
        //     var newmode = data.newmode;
        //     switch (newmode) {
        //         case "stopped":
        //             pass;
        //             break;
        //         case "paused":
        //             pass;
        //             break;
        //         case "running":
        //             pass;
        //             break;
        //     }
        // });

        return that;
    }

    function startTimer(that) {
        stopTimer(that);
        that.timerTicks = 0;
        // start the (repeated) timer on which pulse the simulation will be driven.
        that.timer = setInterval(function() {
            tickTimer(that);
            that.timerTicks++;
        },that.updateDuration);
    }

    function loadMap(that) {
        $.getJSON("/challenge/map")
            .then(function(skin) {
                that.skin = skin;
                return $.getJSON("/challenge/map")
                    .done(function (response) {
                        let recording_json = response[1].results;
                        let recording = createRecording(that, recording_json);
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


    function stopTimer(that) {
        if(that.timer != null) {
            clearInterval(that.timer);
            that.timer = null;
        }
    }

    function tickTimer(that) {
        that.timerListeners.forEach( function(listener) {
            listener.timerTick();
        });
    }


})(jQuery);