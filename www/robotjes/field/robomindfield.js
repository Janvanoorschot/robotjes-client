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

    $.fn.robotjes.fieldview = function(node, uuid) {
        let that = {};

        // set that 'fixed' data
        for (let n in defaults) {
            that[n] = defaults[n];
        }

        that.node = node;
        that.uuid = uuid;

        // timer state
        that.timer = null;
        that.timerListeners = [];
        that.timerTicks = 0;
        that.recordingDelta = (5*1000)/50;  // every 5 seconds (in sync with status_keeper)

        that.state = "state_ids_unknown";

        that.game_id = null;
        that.player_id = null;
        that.game_tick = 0;

        that.someTimer = function(timerTick) {
        };

        populate(that);
        that.timerListeners.push(timerHandler);
        startTimer(that);

        return that;
    };

    function populate(that) {
        // create challenge node
        //that.node.append($('<div class="challengepane"></div>'));
    }

    function timerHandler(that, timerTick) {
        switch(that.state) {
            case 'state_ids_unknown':
                handleIdsUnkown(that);
                break;
            case 'state_running':
                handleRunning(that);
                break;
            default:
                break;
        }
    }

    function handleIdsUnkown(that) {
        let url = '/bubble/info/'+that.uuid;
        $.ajax({
            method: "GET",
            url: url,
            async: true,
            dataType: 'json'
        })
            .done(function(data){
                if("player_id" in data) {
                    console.log("1");
                    that.player_id = data["player_id"];
                    that.game_id = data["game_id"];
                    that.state = "state_running";
                }
            })
            .fail(function(data) {
                console.log(".error");
            });
    }

    function handleRunning(that) {
        let url = `/bubble/game/${that.game_id}/player/${that.player_id}/status/${that.game_tick}`;
        $.ajax({
            method: "GET",
            url: url,
            async: true,
            dataType: 'json'
        })
            .done(function(data){
                console.log(`2.5:${that.state}`);
            })
            .fail(function(data) {
                console.log(".error");
            });
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


})(jQuery);