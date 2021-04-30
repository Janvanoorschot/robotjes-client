/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * Paints the Beacons. on the beacon layer
 *
 * @author jan
 * @since GOL1.0
 */
(function($) {

    var defaults = {
    };

    /**
     * Functional constructor for the painter.
     */
    $.fn.rm.beaconpainter = function(recording) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        initialize(that);

        that.addBeacon = function(x,y) {
            addBeacon(that,x,y);
        };

        that.removeBeacon = function(x,y) {
            removeBeacon(that,x,y);
        };

        that.getBeacons = function() {
            result = [];
            that.beacons.forEach(function(beacon) {
                result.append([beacon.x, beacon.y]);
            });
            return result;
        }

        that.draw = function(scenery) {
            that.beacons.forEach( function(beacon) {
                beacon.draw(scenery);
            });
        };

        that.startDroppingBeacon = function(sprite,x,y) {
            that.commands[sprite] = [x,y];
        }

        that.stopDroppingBeacon = function(sprite) {
            if(sprite in that.commands) {
                var loc = that.commands[sprite];
                that.addBeacon(loc[0],loc[1]);
                delete that.commands[sprite];
            } else {
                // console.log("no drop");
            }
        }

        return that;
    };

    function initialize(that) {
        that.commands = {};  // outstanding commands to drop beacons
        that.beacons = [];   // present beacons

        for(var i in that.recording.beaconLines()) {
            var bdef = that.recording.beaconLines()[i];
            addBeacon(that,bdef.x,bdef.y);
        }
    }

    function addBeacon(that, x, y) {
        var beacon = $.fn.rm.beacon(that.recording,x,y,that.recording.images['beacon']);
        that.beacons.push(beacon);
    }

    function removeBeacon(that,x,y) {
        var b = null;
        var ix = -1;
        for(var i in that.beacons) {
            var beacon = that.beacons[i];
            if(beacon.x == x && beacon.y == y) {
                b = beacon;
                ix = i;
            }
        }
        if(ix >= 0) {
            that.beacons.splice(ix,1);
        }
    }

    $.fn.rm.beacon = function(recording,x,y,image) {
        var that = {};
        that.recording = recording;
        that.x = x;
        that.y = y;
        that.image = image;
        that.ani = $.fn.rm.maptile(recording,x,y,that.image);

        that.draw = function(scenery) {
            that.ani.draw(scenery);
        }

        return that;
    }

})(jQuery);

