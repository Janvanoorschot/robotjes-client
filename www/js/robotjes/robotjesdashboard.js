'use strict';
(function ($) {

    $.fn.robotjes.robotjesdashboard = function (node) {
        let that = {};

        that.node = node;

        that.monitor_event = function (type, msg, args) {
            if (type === MONTYPE_GAMETICK) {
                doUpdateCounter(that, msg, args[2]);
            }
        }

        return that;
    }

    function doUpdateCounter(that, counter, counter_value) {
        switch (counter) {
            case MONMSG_SERVER:
                $('[name=server_tick]', that.node).html(counter_value);
        }
    }

})(jQuery);