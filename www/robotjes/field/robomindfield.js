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


        that.someTimer = function(timerTick) {
            playerStyatus(that);
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

    function playerStyatus(that) {
        let url = '/bubble/info/'+that.uuid;
        $.ajax({
            method: "GET",
            url: url,
            async: true,
            dataType: 'json'
        })
        .done(function(data){
        })
        .error(function(data) {
            console.log("error");
        })
        .success(function(data){
        });

        $.ajax({
            url: url,
            async: true,
            dataType: 'json',
            success: function (response) {
            },
            error: function(jqXHR,type,e) {
                console.error("rest call failed");
            }
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