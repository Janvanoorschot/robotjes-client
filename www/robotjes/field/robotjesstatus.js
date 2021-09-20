'use strict';

(function ($) {

    var defaults = {
        'bogus': '0',
    };

    $.fn.robotjes.robotjesstatus = function (node, timerTick, status) {
        let that = {};
        for (let n in defaults) {
            that[n] = defaults[n];
        }
        that.node = node;
        that.status = status;

        that.newStatus = function(timerTick, status) {
            doNewStatus(that, timerTick, status)
        };

        populate(that);
        return that;
    };

    function populate(that) {
        var statusnode = $(`
            <div class="container">
                <div class="row">
                    <div class="col-sm">
                        First field
                    </div>
                    <div class="col-sm">
                        Second field
                    </div>
                    <div class="col-sm">
                        Third field
                    </div>
                </div>
            </div>
        `);
        that.node.append(statusnode);
    }

    function doNewStatus(that, timerTick, status) {

    }

})(jQuery);