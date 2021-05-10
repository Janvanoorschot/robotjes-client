'use strict';
(function($) {

    /** initialise namespace */

    $.fn.startmon = function() {
        if($.fn.monitor.singleton === undefined) {
            $.fn.monitor.singleton = $.fn.monitor.handler();
            $.fn.monitor.singleton.start();
        }

    };

    $.fn.stopmon  = function() {
        if($.fn.monitor.singleton !== undefined) {
            $.fn.monitor.singleton.stop();
            $.fn.monitor.singleton = undefined;
        }

    };

    $.fn.registermon  = function(listener) {
        if($.fn.monitor.singleton !== undefined) {
            $.fn.monitor.singleton.addListener(listener);
        }
    };

    $.fn.deregistermon  = function(listener) {
        if($.fn.monitor.singleton !== undefined) {
            $.fn.monitor.singleton.removeListener(listener);
        }
    };

    $.fn.genmon = function(type, msg) {
        if($.fn.monitor.singleton !== undefined) {
            $.fn.monitor.singleton.genmon(type, msg, arguments.slice(2));
        }
    };

    $.fn.monitor.handler = function() {
        let that = {};

        that.listeners = [];

        that.start = function() {
        }

        that.stop = function() {
        }

        that.addListener = function(listener) {
            that.listeners.push(listener);
        }

        that.removeListener = function(listener) {
            const index = that.listeners.indexOf(listener);
            if (index > -1) {
                that.listeners.splice(index, 1);
            }
        }

        that.genmon = function(type, msg, args) {
            that.listeners.forEach(listener => {
                if(listener.hasOwnProperty('genmon')) {
                    listener.genmon(type, msg, args);
                }
            });
        }

        return that;
    }

})(jQuery);