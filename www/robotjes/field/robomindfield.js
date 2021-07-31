/**
 * The Robomind Field viewer.
 **/
(function($) {
    "use strict";
    /*global jQuery */

    let defaults = {
        'id':'0',
        updateDuration:500
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


        that.someTimer = function(timerTick) {
            console.log("a timer: " + timerTick);
        };

        populate(that);
        that.timerListeners.push(that.someTimer);
        startTimer(that);

        return that;
    };

    function populate(that) {
        // create challenge node
        //that.node.append($('<div class="challengepane"></div>'));
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