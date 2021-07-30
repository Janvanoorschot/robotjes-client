/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * User: jan
 * Date: 17/10/12
 * Time: 10:39 AM
 * Paints the map using tiles.
 */

(function($) {

    var defaults = {
    };

    /**
     * Functional constructor for the painter.
     */
    $.fn.rm.mappainter = function(recording) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        initialize(that);

        that.draw = function(scenery) {
            that.anis.forEach( function(anitile) {
                anitile.draw(scenery)
            });
        };

        return that;
    };

    function initialize(that) {
        that.anis = [];
        var y = 0;
        for(var rowIx in that.recording.mapLines()) {
            var row = that.recording.mapLines()[rowIx];
            var x = 0;
            for(var columnIx in row) {
                var column = row[columnIx];
                var name =  "tile-" + column;
                var image = that.recording.images[name];
                if(image != null) {
                    var anitile = $.fn.rm.maptile(that.recording, x,y,image);
                    that.anis.push(anitile);
                }
                x = x + 1;
            }
            y = y + 1;
        }
    }




})(jQuery);
