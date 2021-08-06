'use strict';

(function ($) {

    var defaults = {
        'id': '0',
        updateDuration: 50       // timer tick every 50 ms (20 times per second)>
    };

    $.fn.robotjes.robotjesresult = function (node, status) {
        let that = {};
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.status = status;

        populate(that);
        return that;
    };

    function populate(that) {
        that.timerListeners = [];
        that.timerListeners.push(that.statusTimer);
        startTimer(that);
        return that;
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