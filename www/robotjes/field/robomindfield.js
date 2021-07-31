/*
 * Copyright (c) 2020 Jan van Oorschot BV. All rights reserved.
 */

/**
 * The Robomind Field viewer.
 **/
(function($) {
    "use strict";
    /*global jQuery */

    let defaults = {
        'id':'0',
        updateDuration:50
    };

    $.fn.rm.robomindfieldPhase2 = function(node) {
        let that = {};
        that.node = node;
        that.node.append($("<h1>asdasd</h1>"));
        return that;
    };

    $.fn.rm.robomindfieldPhase3 = function(node) {
        let that = {};
        return that;
    };

    $.fn.rm.robomindfield = function(node,skin,images,challengeId,language) {
        let that = {};

        // set that 'fixed' data
        for (let n in defaults) {
            that[n] = defaults[n];
        }

        that.node = node;
        that.skin = skin;
        that.images = images;
        that.challengeId = challengeId;
        that.language = language;
        that.script = "";

        // timer state
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        // that.recordingDelta = 10;
        that.recordingDelta = (5*1000)/50;  // every 5 seconds (in sync with status_keeper)

        let stepping = false;
        that.movieplayer = null;
        that.recording = null;
        that.movieplayer = null;

        that.stop = function () {
            that.movieplayer.stop();
            that.editor.setExecutedLine(-1);
        };

        that.cont = function () {
            that.movieplayer.cont();
        };

        that.step = function () {
            that.movieplayer.step();
        };

        that.pause = function () {
            that.movieplayer.pause();
        };

        that.clearWorldMessages = function() {
            clearWorldMessage(that);
        };

        that.setWorldMessage = function (text) {
            displayWorldMessage(that, text);
        };

        that.clearEditorMessages = function() {
            clearEditorMessages(that);
        };

        that.setEditorMessages = function (messages) {
            that.messages = messages;
            displayEditorMessages(that);
        };

        that.isSoundEnabled = function () {
            return that.movieplayer.isSoundEnabled();
        };

        that.setSoundEnabled = function (bool) {
            that.movieplayer.setSoundEnabled(bool);
        };

        that.setSpeed = function(speed) {
            that.movieplayer.setSpeed(speed);
        };

        that.recordingTimer = function(timerTick) {
            doRecordingTimer(that, timerTick);
        };

        populate(that);

        if(false) {
            that.timerListeners.push(that.recordingTimer);
            that.timerListeners.push(that.movieplayer.timerTick);
            startTimer(that);
            that.movieplayer.start(that.recording, stepping);
        }

        return that;
    };

    function populate(that) {
        // create challenge node
        that.node.append($('<div class="challengepane"></div>'));
        // create messages node
        that.messagesPaneNode = $('<div class="messagespane"></div>');
        that.messagesPaneNode.css("display","none");
        that.node.append(that.messagesPaneNode);

        if(false) {
            // get the available fields and for the time being select the first one
            that.fields = doLoadFields(that);
            that.game_id = Object.keys(that.fields)[0];
            that.maze_map = doGetMap(that);
            that.recording = $.fn.rm.recording(that.maze_map.maze_map, that.skin, that.images);
            that.recording.setDeltaFrames(that.game_id);

            // create movieplayer node
            var moviePlayerNode = $('<div id="worldpane" class="worldpane" ><div id="worldsubpane" style="height: 100%; width: 100%;" class="animation"></div></div>');
            that.movieplayer =  $.fn.rm.movieplayer('robomindide',moviePlayerNode.find('#worldsubpane'), that, that.skin,that.images);
            that.movieplayer.setSpeed(1);
            that.movieplayer.setSoundEnabled(false);
            that.node.append(moviePlayerNode);
        }

        var centerx = $.fn.rm.sessionstate['centerx'];
        var centery = $.fn.rm.sessionstate['centery'];
        var centerzoom = $.fn.rm.sessionstate['centerzoom'];
        if(centerx && centerx>0 && centery && centery>0 && centerzoom && centerzoom>0) {
            that.movieplayer.setCenter(centerx,centery,centerzoom);
        }
    }

    function clearWorldMessage(that) {
        that.messagesPaneNode.html('');
        that.messagesPaneNode.css("display","none");

    }

    function displayWorldMessage(that, text) {
        that.messagesPaneNode.html(text);
        that.messagesPaneNode.css("display","block");

    }

    function clearEditorMessages(that) {
        that.editor.clearMessages();
    }

    function displayEditorMessages(that) {
        that.messages.forEach( function(message) {
            that.editor.showErrorMessage(message.line, message.msg);
        });
    }

    function doLoadFields(that) {
        let fields = null;
        let url = window.location.pathname+'/field/fields';
        $.ajax({
            url: url,
            async: false,
            dataType: 'json',
            success: function (response) {
                fields = response;
            },
            error: function(jqXHR,type,e) {
                console.error("loading fields failed");
            }
        });
        return fields;
    }

    function doGetMap(that) {
        if(that.game_id) {
            let map = null;
            let url = window.location.pathname+'/field/gamemap?game_id=' + that.game_id;
            $.ajax({
                url: url,
                async: false,
                dataType: 'json',
                success: function (response) {
                    map = response;
                },
                error: function(jqXHR,type,e) {
                    console.error("loading fields failed");
                }
            });
            return map;
        } else {
            return null; // no game_id????
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
        // start the (repeated) timer on which pulse the simulation will be driven.
        that.timer = setInterval(function() {
            try {
                tickTimer(that, that.timerTicks);
            } catch(err) {
                // noop
                console.log("error during timer handling: ["+err+"]");
            } finally {
                that.timerTicks++;
            }
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