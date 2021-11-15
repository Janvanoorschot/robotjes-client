/**
 * The Local (!!) Robomind Field viewer.
 **/
(function($) {
    "use strict";
    /*global jQuery */

    $.fn.robotjes.localfieldview = function(node, statusnode, url="") {
        let that = {};

        that.node = node;
        that.statusnode = statusnode;
        that.url = url;

        // timer state
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        that.updateDuration = 5000;

        // screen components
        that.viewer = null;

        // state: possible states:
        //      state_uuid_unknown
        //      state_running
        //      state_stopped
        //      state_error
        that.uuid = null;
        that.state = "state_uuid_unknown";

        // collected data
        that.game_id = null;
        that.player_id = null;
        that.game_tick = 0;

        that.assignUUID = function(uuid) {
            // the viewer pages has started anew and a UUID was passed
            if(that.state == 'state_uuid_unknown') {
                that.uuid = uuid;
                toStateRegistered(that);
            }
        };

        populate(that);
        that.timerListeners.push(timerHandler);
        startTimer(that);

        return that;
    };

    function populate(that) {
        toStateUuidUnknown(that);
        that.node.resize();
    }

    function timerHandler(that, timerTick) {
        // collect Bubble info about the UUID we are tracing
        let url ="/field/status";
        $.ajax({
            method: "GET",
            url: url,
            async: true,
            dataType: 'json'
        })
            .done(function(data) {
                switch(that.state) {
                    case 'state_uuid_unknown':
                        if(data.uuid != "") {
                            toStateRegistered(that, data);
                        } else {
                            keepStateUuidUnknown(that, data);
                        }
                        break;
                    case 'state_registered':
                        if(data.uuid != "" && data.started) {
                            toStateRunning(that, timerTick, data);
                        } else {
                            keepStateRegistered(that, data);
                        }
                        break;
                    case 'state_running':
                        if(isDone(that, data)) {
                            toStateStopped(that, data);
                        } else {
                            keepStateRunning(that, timerTick, data);
                        }
                        break;
                    case 'state_stopped':
                        if(data.uuid != "") {
                            keepStateStopped(that, data);
                        } else {
                            toStateUuidUnknown(that, data);
                        }
                        break;
                    case 'state_error':
                        keepStateError(that, data);
                        break;
                }
            })
            .fail(function(data) {
                toStateError(that, data);
            });
    }

    function isDone(that, data) {
        var last_game_tick = data["status"]["player_status"]["last_tick"];
        var current_game_tick = that.viewer.currentGameTick();
        if(last_game_tick > 0 && last_game_tick < current_game_tick) {
            return true;
        } else {
            return false;
        }
    }

    function toStateUuidUnknown(that) {
        var bannernode = that.node;
        bannernode.empty();
        bannernode.append(
            '<button type=\'submit\' class="btn btn-success" id="activate" name="jvo_activate" value=\'Go\'> <i class="icon-play"></i>Activate</button>'
        );
        let statusnode = that.statusnode;
        statusnode.hide();
        that.state = 'state_uuid_unknown';
    }

    function keepStateUuidUnknown(that, data) {
        // do nothing
    }

    function toStateRegistered(that, data) {
        var bannernode = that.node;
        bannernode.empty();
        bannernode.append(`<p>Waiting to enter the Game.</p>`);
        bannernode.append(`<p>UUID: ${that.uuid}</p>`);
        that.state = 'state_registered';
    }

    function keepStateRegistered(that, data) {
        // do nothing (maybe spinner?)
    }

    function toStateRunning(that, timerTick, data) {
        that.game_id = data.info.game_id;
        that.player_id = data.info.player_id;
        var viewernode = that.node;
        viewernode.empty();
        var statusnode = that.statusnode;
        statusnode.show();
        that.viewer = $.fn.robotjes.robotjesviewer(viewernode, statusnode, that.game_id, that.player_id, that.url);
        that.state = 'state_running';

    }

    function keepStateRunning(that, timerTick, data) {
    }

    function toStateStopped(that, data) {
        var viewnode = that.node;
        viewnode.empty();
        that.state = 'state_stopped';
    }

    function keepStateStopped(that, data) {
        // do nothing
    }

    function toStateError(that, data) {
        var viewnode = that.node;
        viewnode.empty();
        that.state = 'state_error';
    }

    function keepStateError(that, data) {
        // do nothing
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
            listener(that, timerTick);
        });
    }

})(jQuery);