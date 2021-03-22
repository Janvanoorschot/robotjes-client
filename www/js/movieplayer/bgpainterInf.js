/*
 * Copyright (c) 2013 Jan van Oorschot BV. All rights reserved.
 */

/**
 * User: jan
 * Date: 17/10/12
 * Time: 10:39 AM
 * Paints the background using tiles.
 */

(function($) {

    var defaults = {
        tileCount:2
    };

    /**
     * Functional constructor for the painter.
     * @param recording
     * @param viewport
     */
    $.fn.rm.bgpainterInf = function(recording, viewport) {
        var that = {};

        // set data
        for (n in defaults) {
            that[n] = defaults[n];
        }
        that.recording = recording;

        initialize(that);

        // public API (painter)
        that.draw = function(scenery) {
            scenery.paintBackground(viewport, that.bgImage);
        };

        return that;
    };

    function initialize(that) {
        // create an invisible canvas on which we will create the repeating background
        var bgImage = that.recording.images['bg'];
        that.bgImage = bgImage;
    }

})(jQuery);
