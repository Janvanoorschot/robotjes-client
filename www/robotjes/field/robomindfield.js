/**
 * The Robomind Field viewer.
 **/
(function($) {
    "use strict";
    /*global jQuery */

    let defaults = {
        'id':'0',
        updateDuration:1000
    };

    $.fn.robotjes.fieldview = function(node, url="") {
        let that = {};

        // set that 'fixed' data
        for (let n in defaults) {
            that[n] = defaults[n];
        }

        that.node = node;
        that.url = url;

        // timer state
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        that.recordingDelta = (5*1000)/50;  // every 5 seconds (in sync with status_keeper)

        // screen components
        that.status = null;
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
            that.uuid = uuid;
            toStateRegistered(that);
        }

        that.someTimer = function(timerTick) {
        };

        populate(that);
        that.timerListeners.push(timerHandler);
        startTimer(that);

        return that;
    };

    function populate(that) {
        // create the panes that are used in the different states
        var fieldnode = $(`
            <div class="field">
                <div class="fieldbanner"></div>
                <div class="fieldstatus"></div>
                <div class="fieldviewer"></div>
            </div>
        `);
        that.node.append(fieldnode);
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
                            toStateRunning(that, data);
                        } else {
                            keepStateRegistered(that, data);
                        }
                        break;
                    case 'state_running':
                        if(data.uuid != "" && data.done) {
                            toStateStopped(that, data);
                        } else {
                            keepStateRunning(that, data);
                        }
                        break;
                    case 'state_stopped':
                        if(data.uuid != "" && data.done) {
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

    function toStateUuidUnknown(that, data) {

    }

    function keepStateUuidUnknown(that, data) {

    }

    function toStateRegistered(that, data) {
        var bannernode = that.node.find('.field .fieldbanner');
        bannernode.append(`<p>Waiting to enter the Game.</p>`);
        bannernode.append(`<p>UUID: ${that.uuid}</p>`);
        var statusnode = that.node.find('.field .fieldstatus');
        statusnode.empty();
        var viewnode = that.node.find('.field .fieldviewer');
        statusnode.empty();
        that.state = 'state_registered';
    }

    function keepStateRegistered(that, data) {
        // do nothing (maybe spinner?)
    }

    function toStateRunning(that, data) {
        that.game_id = data.info.game_id;
        that.player_id = data.info.player_id;
        var bannernode = that.node.find('.field .fieldbanner');
        bannernode.empty();
        bannernode.append(`<p>Game Running.</p>`);
        var statusnode = that.node.find('.field .fieldstatus');
        statusnode.empty();
        that.status = $.fn.robotjes.robotjesstatus(statusnode, data);
        var viewernode = that.node.find('.field .fieldviewer');
        viewernode.empty();
        that.viewer = $.fn.robotjes.robotjesviewer(viewernode, that.game_id, that.player_id, that.url);
        viewernode.resize();
        that.state = 'state_running';
    }

    function keepStateRunning(that, data) {
    }

    function toStateStopped(that, data) {
        that.state = 'state_stopped';
    }

    function keepStateStopped(that, data) {

    }

    function toStateError(that, data) {
        that.state = 'state_error';
    }

    function keepStateError(that, data) {

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